// the max distance to ray march in meters
const float defaultTMaxMax = 9000000.0;

// Sample per pixel for ray marching
const vec2 RayMarchMinMaxSPP = vec2(16, 32);

struct SingleScatteringResult {
  vec3 L;                        // Scattered light (luminance)
  vec3 OpticalDepth;             // Optical depth (1/m)
  vec3 Transmittance;            // Transmittance in [0,1] (unitless)
  vec3 MultiScatAs1;
  vec3 NewMultiScatStep0Out;
  vec3 NewMultiScatStep1Out;
};

SingleScatteringResult IntegrateScatteredLuminance(
  in vec2 pixPos,
  in vec3 WorldPos,
  in vec3 WorldDir,
  in vec3 SunDir,
  in AtmosphereParameters Atmosphere,
  in bool ground,
  in float SampleCountIni,
  in float DepthBufferValue,
  in bool VariableSampleCount,
  in bool MieRayPhase,
  in float tMaxMax,
  in vec3 resolution
) {
  const bool debugEnabled = false;
  SingleScatteringResult result = SingleScatteringResult(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));

  vec3 ClipSpace = vec3((pixPos / vec2(resolution)) * vec2(2.0, -2.0) - vec2(1.0, -1.0), 1.0);

  // Compute next intersection with atmosphere or ground 
  vec3 earthO = vec3(0.0, 0.0, 0.0);
  float tBottom = raySphereIntersectNearest(WorldPos, WorldDir, earthO, Atmosphere.BottomRadius);
  float tTop = raySphereIntersectNearest(WorldPos, WorldDir, earthO, Atmosphere.TopRadius);
  float tMax = 0.0;
  if(tBottom < 0.0) {
    if(tTop < 0.0) {
      tMax = 0.0; // No intersection with earth nor atmosphere: stop right away  
      return result;
    } else {
      tMax = tTop;
    }
  } else {
    if(tTop > 0.0) {
      tMax = min(tTop, tBottom);
    }
  }

  if(DepthBufferValue >= 0.0) {
    ClipSpace.z = DepthBufferValue;
    if(ClipSpace.z < 1.0) {
      vec4 DepthBufferWorldPos = iCameraProjectionInverse * vec4(ClipSpace, 1.0);
      DepthBufferWorldPos /= DepthBufferWorldPos.w;

      float tDepth = length(DepthBufferWorldPos.xyz - (WorldPos + vec3(0.0, 0.0, -Atmosphere.BottomRadius))); // apply earth offset to go back to origin as top of earth mode. 
      if(tDepth < tMax) {
        tMax = tDepth;
      }
    }
      // if (VariableSampleCount && ClipSpace.z == 1.0f)
      //     return result;
  }
  tMax = min(tMax, tMaxMax);

  // Sample count 
  float SampleCount = SampleCountIni;
  float SampleCountFloor = SampleCountIni;
  float tMaxFloor = tMax;
  if(VariableSampleCount) {
    SampleCount = mix(RayMarchMinMaxSPP.x, RayMarchMinMaxSPP.y, clamp(tMax * 0.01, 0.0, 1.0));
    SampleCountFloor = floor(SampleCount);
    tMaxFloor = tMax * SampleCountFloor / SampleCount; // rescale tMax to map to the last entire step segment.
  }
  float dt = tMax / SampleCount;

  // Phase functions
  const float uniformPhase = 1.0 / (4.0 * PI);
  vec3 wi = SunDir;
  vec3 wo = WorldDir;
  float cosTheta = dot(wi, wo);
  float MiePhaseValue = hgPhase(Atmosphere.MiePhaseG, -cosTheta); // negate cosTheta because WorldDir is an "in" direction. 
  float RayleighPhaseValue = RayleighPhase(cosTheta);

#ifdef ILLUMINANCE_IS_ONE
  // When building the scattering factor, we assume light illuminance is 1 to compute a transfer function relative to identity illuminance of 1.
  // This makes the scattering factor independent of the light. It is now only linked to the atmosphere properties.
  vec3 globalL = vec3(1.0);
#else
  vec3 globalL = iSunIlluminance;
#endif

  // Ray march the atmosphere to integrate optical depth
  vec3 L = vec3(0.0);
  vec3 throughput = vec3(1.0);
  vec3 OpticalDepth = vec3(0.0);
  float t = 0.0;
  float tPrev = 0.0;
  const float SampleSegmentT = 0.3;

  for(float s = 0.0; s < SampleCount; s += 1.0) {
    if(VariableSampleCount) {
      // More expensive but artefact free
      float t0 = s / SampleCountFloor;
      float t1 = (s + 1.0) / SampleCountFloor;
      // Non linear distribution of sample within the range.
      t0 = t0 * t0;
      t1 = t1 * t1;
      // Make t0 and t1 world space distances.
      t0 = tMaxFloor * t0;
      if(t1 > 1.0) {
        t1 = tMax;
        //	t1 = tMaxFloor;	// this reveal depth slices
      } else {
        t1 = tMaxFloor * t1;
      }
      //t = t0 + (t1 - t0) * (whangHashNoise(pixPos.x, pixPos.y, gFrameId * 1920 * 1080)); // With dithering required to hide some sampling artefact relying on TAA later? This may even allow volumetric shadow?
      t = t0 + (t1 - t0) * SampleSegmentT;
      dt = t1 - t0;
    } else {
      //t = tMax * (s + SampleSegmentT) / SampleCount;
			// Exact difference, important for accuracy of multiple scattering
      float NewT = tMax * (s + SampleSegmentT) / SampleCount;
      dt = NewT - t;
      t = NewT;
    }
    vec3 P = WorldPos + t * WorldDir;

    MediumSampleRGB medium = sampleMediumRGB(P, Atmosphere);
    vec3 SampleOpticalDepth = medium.extinction * dt;
    vec3 SampleTransmittance = exp(-SampleOpticalDepth);
    OpticalDepth += SampleOpticalDepth;

    float pHeight = length(P);
    vec3 UpVector = P / pHeight;
    float SunZenithCosAngle = dot(SunDir, UpVector);
    vec2 uv;
    LutTransmittanceParamsToUv(Atmosphere, pHeight, SunZenithCosAngle, uv);
    vec3 TransmittanceToSun = texture(iTransmittance, uv).rgb;

    vec3 PhaseTimesScattering;
    if(MieRayPhase) {
      PhaseTimesScattering = medium.scatteringMie * MiePhaseValue + medium.scatteringRay * RayleighPhaseValue;
    } else {
      PhaseTimesScattering = medium.scattering * uniformPhase;
    }

    // Earth shadow
    float tEarth = raySphereIntersectNearest(P, SunDir, earthO + PLANET_RADIUS_OFFSET * UpVector, Atmosphere.BottomRadius);
    float earthShadow = tEarth >= 0.0 ? 0.0 : 1.0;

    // Dual scattering for multi scattering
    vec3 multiScatteredLuminance = vec3(0.0);
#if MULTISCATAPPROX_ENABLED
    multiScatteredLuminance = GetMultipleScattering(Atmosphere, medium.scattering, medium.extinction, P, SunZenithCosAngle);
#endif

    float shadow = 1.0;
#if SHADOWMAP_ENABLED
    // First evaluate opaque shadow
    shadow = getShadow(Atmosphere, P);
#endif

    vec3 S = globalL * (earthShadow * shadow * TransmittanceToSun * PhaseTimesScattering + multiScatteredLuminance * medium.scattering);

#define MULTI_SCATTERING_POWER_SERIE 1

#if MULTI_SCATTERING_POWER_SERIE == 0
    result.MultiScatAs1 += throughput * medium.scattering * 1.0 * dt;
#else
    vec3 MS = medium.scattering * 1.0;
    vec3 MSint = (MS - MS * SampleTransmittance) / medium.extinction;
    result.MultiScatAs1 += throughput * MSint;
#endif

    // Evaluate input to multi scattering
    {
      vec3 newMS;

      newMS = earthShadow * TransmittanceToSun * medium.scattering * uniformPhase * 1.0;
      result.NewMultiScatStep0Out += throughput * (newMS - newMS * SampleTransmittance) / medium.extinction;

      newMS = medium.scattering * uniformPhase * multiScatteredLuminance;
      result.NewMultiScatStep1Out += throughput * (newMS - newMS * SampleTransmittance) / medium.extinction;
    }

#if 0
    L += throughput * S * dt;
    throughput *= SampleTransmittance;
#else
	  // integrate along the current step segment 
    vec3 Sint = (S - S * SampleTransmittance) / medium.extinction;
    // accumulate and also take into account the transmittance from previous steps
    L += throughput * Sint;
    throughput *= SampleTransmittance;
#endif

    tPrev = t;
  }

  if(ground && tMax == tBottom && tBottom > 0.0) {
    // Account for bounced light off the earth
    vec3 P = WorldPos + tBottom * WorldDir;
    float pHeight = length(P);

    vec3 UpVector = P / pHeight;
    float SunZenithCosAngle = dot(SunDir, UpVector);
    vec2 uv;
    LutTransmittanceParamsToUv(Atmosphere, pHeight, SunZenithCosAngle, uv);
    vec3 TransmittanceToSun = texture(iTransmittance, uv).rgb;

    float NdotL = clamp(dot(normalize(UpVector), normalize(SunDir)), 0.0, 1.0);
    L += globalL * TransmittanceToSun * throughput * NdotL * Atmosphere.GroundAlbedo / PI;
  }

  result.L = L;
  result.OpticalDepth = OpticalDepth;
  result.Transmittance = throughput;
  return result;
}