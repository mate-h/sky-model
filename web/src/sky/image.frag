#include uniforms
#include common
#include ray
#include raymarch

vec3 sunWithBloom(vec3 rayDir, vec3 sunDir) {
  const float sunSolidAngle = 0.004675;
  const float minSunCosTheta = cos(sunSolidAngle);

  float cosTheta = dot(rayDir, sunDir);
  if(cosTheta >= minSunCosTheta)
    return vec3(1.0);

  float offset = minSunCosTheta - cosTheta;
  float gaussianBloom = exp(-offset * 50000.0) * 0.5;
  float invBloom = 1.0 / (0.02 + offset * 500.0) * 0.01;
  return vec3(gaussianBloom + invBloom);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec3 sunDir = iSunDirection;

  // determine the ray direction
  vec3 rayOrigin, rayDir;
  cameraRay(rayOrigin, rayDir);

  // calculate the sky luminance
  vec3 lum, transmittance;
  float atmosphereRadiusMM = getAtmosphereSize();
  if(length(rayOrigin) < atmosphereRadiusMM * 1.0) {
    lum = getValFromSkyLUT(iSkyview, iResolution.xy, rayDir, sunDir);
    transmittance = getValFromTLUT(iTransmittance, iResolution.xy, rayOrigin, sunDir);
  } else {
    vec3 inscatter;

    vec2 atmos_intercept = rayIntersectSphere2D(rayOrigin, rayDir, atmosphereRadiusMM);
    float terra_intercept = rayIntersectSphere(rayOrigin, rayDir, groundRadiusMM);
    float mindist, maxdist;
    if(atmos_intercept.x < atmos_intercept.y) {
      mindist = atmos_intercept.x > 0.0 ? atmos_intercept.x : 0.0;
      maxdist = atmos_intercept.y > 0.0 ? atmos_intercept.y : 0.0;
    } else {
      // no atmosphere intersection
      // fragColor = vec4(0.0, 0.0, 0.0, 1.0);
      // return;
    }
    if(length(rayOrigin) < atmosphereRadiusMM) {
      mindist = 0.0;
    }
    
    if(terra_intercept > 0.0) {
      maxdist = terra_intercept;

      // fragColor = vec4(0.0, 0.0, 0.0, 1.0);
      // return;
    }
    if (length(rayOrigin) < groundRadiusMM) {
      // start on ground and end in atmosphere top
      mindist = terra_intercept;
      maxdist = atmos_intercept.y;
    }

    vec3 pos = rayOrigin + mindist * rayDir;
    float tMax = maxdist - mindist;
    raymarchScattering(pos, rayDir, sunDir, tMax, 8., transmittance, lum, inscatter);
  }

  // Bloom should be added at the end, but this is subtle and works well.
  vec3 sunLum = sunWithBloom(rayDir, sunDir);
  // Use smoothstep to limit the effect, so it drops off to actual zero.
  sunLum = smoothstep(0.002, 1.0, sunLum);
  if(length(sunLum) > 0.0) {
    if(rayIntersectSphere(rayOrigin, rayDir, groundRadiusMM) >= 0.0) {
      sunLum *= 0.0;
    } else {
      // If the sun value is applied to this pixel, we need to calculate the transmittance to obscure it.
      sunLum *= transmittance;
    }
  }
  lum += sunLum;

  fragColor = vec4(lum, 1.0);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);

  #include <tonemapping_fragment>
  gl_FragColor = LinearTosRGB(gl_FragColor);
}