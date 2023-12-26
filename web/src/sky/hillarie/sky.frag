#include common
#include earth
#include integrate
const float REPEAT = 16.;

float checker(vec3 rd) {
  vec2 uv = vec2(0.);
  uv.x = atan(rd.x, rd.z) / (2. * PI) + 0.5;
  uv.y = asin(rd.y) / PI + .5;
  float cx = floor(REPEAT * uv.x);
  float cy = floor(REPEAT * uv.y); 
  float result = mod(cx + cy, 2.0);
  return sign(result);
}

void RenderRayMarchingPS(in vec2 pixPos, out vec4 fragColor) {

  vec4 outputLuminance;
#if COLORED_TRANSMITTANCE_ENABLED
  vec4 outputTransmittance;
#endif

#if COLORED_TRANSMITTANCE_ENABLED
  outputTransmittance = vec4(0., 0., 0., 1.);
#endif

  AtmosphereParameters Atmosphere = GetAtmosphereParameters();

  // vec3 ClipSpace = vec3((pixPos / vec2(iResolution)) * vec2(2.0, -2.0) - vec2(1.0, -1.0), 1.0);
  // vec4 HViewPos = iCameraProjectionInverse * vec4(ClipSpace, 1.0);
  // vec3 WorldDir = normalize(mat3(iCameraWorld) * HViewPos.xyz / HViewPos.w);
  // vec3 WorldPos = cameraPosition + vec3(0, 0, Atmosphere.BottomRadius);

  vec3 WorldDir, WorldPos;
  cameraRay(WorldPos, WorldDir);
  // WorldPos /= 1000.0;
  WorldPos += vec3(0, Atmosphere.BottomRadius, 0);

  fragColor.rgb += vec3(checker(WorldDir)*0.06);

  // fragColor = vec4(vec3(checker(WorldDir)*0.06), 1.0);
  // fragColor = vec4((WorldDir * 0.5) + 0.5, 1.0); 
  // fragColor = vec4(WorldPos, 1.0);
  // return;

  float DepthBufferValue = -1.0;

	//if (pixPos.x < 512 && pixPos.y < 512)
	//{
	//	outputLuminance = vec4(MultiScatTexture.SampleLevel(samplerLinearClamp, pixPos / vec2(512, 512), 0).rgb, 1.0);
	//	return output;
	//}

  float viewHeight = length(WorldPos);
  vec3 L = vec3(0.);
  // DepthBufferValue = ViewDepthTexture[pixPos].r;
#if FASTSKY_ENABLED
  if(viewHeight < Atmosphere.TopRadius && DepthBufferValue == 1.0) {
    vec2 uv;
    vec3 UpVector = normalize(WorldPos);
    float viewZenithCosAngle = dot(WorldDir, UpVector);

    vec3 sideVector = normalize(cross(UpVector, WorldDir));		// assumes non parallel vectors
    vec3 forwardVector = normalize(cross(sideVector, UpVector));	// aligns toward the sun light but perpendicular to up vector
    vec2 lightOnPlane = vec2(dot(iSunDirection, forwardVector), dot(iSunDirection, sideVector));
    lightOnPlane = normalize(lightOnPlane);
    float lightViewCosAngle = lightOnPlane.x;

    bool IntersectGround = raySphereIntersectNearest(WorldPos, WorldDir, vec3(0, 0, 0), Atmosphere.BottomRadius) >= 0.0;

    SkyViewLutParamsToUv(Atmosphere, IntersectGround, viewZenithCosAngle, lightViewCosAngle, viewHeight, uv);

		//outputLuminance = vec4(SkyViewLutTexture.SampleLevel(samplerLinearClamp, pixPos / vec2(iResolution), 0).rgb + GetSunLuminance(WorldPos, WorldDir, Atmosphere.BottomRadius), 1.0);
    outputLuminance = vec4(SkyViewLutTexture.SampleLevel(samplerLinearClamp, uv, 0).rgb + GetSunLuminance(WorldPos, WorldDir, Atmosphere.BottomRadius), 1.0);
    fragColor = outputLuminance;
    return;
  }
#else
  if(DepthBufferValue == 1.0)
    L += GetSunLuminance(WorldPos, WorldDir, Atmosphere.BottomRadius);
#endif

#if FASTAERIALPERSPECTIVE_ENABLED

#if COLORED_TRANSMITTANCE_ENABLED
#error The FASTAERIALPERSPECTIVE_ENABLED path does not support COLORED_TRANSMITTANCE_ENABLED.
#else

  ClipSpace = vec3((pixPos / vec2(iResolution)) * vec2(2.0, -2.0) - vec2(1.0, -1.0), DepthBufferValue);
  vec4 DepthBufferWorldPos = mul(iCameraProjectionInverse, vec4(ClipSpace, 1.0));
  DepthBufferWorldPos /= DepthBufferWorldPos.w;
  float tDepth = length(DepthBufferWorldPos.xyz - (WorldPos + vec3(0.0, 0.0, -Atmosphere.BottomRadius)));
  float Slice = AerialPerspectiveDepthToSlice(tDepth);
  float Weight = 1.0;
  if(Slice < 0.5) {
		// We multiply by weight to fade to 0 at depth 0. That works for luminance and opacity.
    Weight = clamp(Slice * 2.0, 0.0, 1.0);
    Slice = 0.5;
  }
  float w = sqrt(Slice / AP_SLICE_COUNT);	// squared distribution

  const vec4 AP = Weight * AtmosphereCameraScatteringVolume.SampleLevel(samplerLinearClamp, vec3(pixPos / vec2(iResolution), w), 0);
  L.rgb += AP.rgb;
  float Opacity = AP.a;

  outputLuminance = vec4(L, Opacity);
	//outputLuminance *= frac(clamp(w*AP_SLICE_COUNT, 0, AP_SLICE_COUNT));
#endif

#else // FASTAERIALPERSPECTIVE_ENABLED

	// Move to top atmosphere as the starting point for ray marching.
	// This is critical to be after the above to not disrupt above atmosphere tests and voxel selection.
  if(!MoveToTopAtmosphere(WorldPos, WorldDir, Atmosphere.TopRadius)) {
		// Ray is not intersecting the atmosphere		
    outputLuminance = vec4(GetSunLuminance(WorldPos, WorldDir, Atmosphere.BottomRadius), 1.0);
    fragColor = outputLuminance;
    // fragColor.rgb += vec3(checker(WorldDir)*vec3(0.01, 0, 0));
    return;
  }

  const bool ground = false;
  const float SampleCountIni = 0.0;
  const bool VariableSampleCount = true;
  const bool MieRayPhase = true;
  SingleScatteringResult ss = IntegrateScatteredLuminance(pixPos, WorldPos, WorldDir, iSunDirection, Atmosphere, ground, SampleCountIni, DepthBufferValue, VariableSampleCount, MieRayPhase, defaultTMaxMax, iResolution);

  L += ss.L;
  vec3 throughput = ss.Transmittance;

#if COLORED_TRANSMITTANCE_ENABLED
  outputLuminance = vec4(L, 1.0);
  outputTransmittance = vec4(throughput, 1.0);
#else
  float Transmittance = dot(throughput, vec3(1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0));
  outputLuminance = vec4(L, 1.0 - Transmittance);
#endif

#endif // FASTAERIALPERSPECTIVE_ENABLED

  fragColor = outputLuminance;
  fragColor.rgb = ss.L;
  // fragColor.rgb += vec3(checker(WorldDir)*0.01);

  // fragColor.rgb = ss.Transmittance;
  fragColor.a = 1.0;
}

void main() {
  RenderRayMarchingPS(gl_FragCoord.xy, gl_FragColor);

  // vec2 uv = gl_FragCoord.xy / iResolution.xy;
  // gl_FragColor = vec4(uv, 0.0, 1.0);
  // gl_FragColor = vec4(iSunDirection, 1.0);
}