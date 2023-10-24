#include ../sky/uniforms
#include ../sky/common
#include ../sky/ray
#include ../sky/raymarch

in vec2 vUv;
in vec3 vWorldPosition;

#define USE_LUT

void applySkyLighting(in vec3 albedo, in vec3 viewNormal, inout vec3 outgoingLight) {
  vec3 ro, rd;
  cameraRay(ro, rd);
  vec3 normal = texture2D(normalMap, vNormalMapUv).xyz;
  normal = normalize(2.0 * normal - 1.0);
  normal = vec3(normal.x, normal.z, -normal.y);
  vec3 pos = transformPosition(vWorldPosition);
  // Calculate the distance from the camera to the current fragment position
  float dist = length(pos - ro);

  vec3 transmittance, in_scatter;

  #ifndef USE_LUT
  float atmosphereRadiusMM = getAtmosphereSize();
  vec2 atmos_intercept = rayIntersectSphere2D(ro, rd, atmosphereRadiusMM);
  float terra_intercept = rayIntersectSphere(ro, rd, groundRadiusMM);
  float mindist, maxdist = dist;
  if(atmos_intercept.x < atmos_intercept.y) {
    mindist = atmos_intercept.x > 0.0 ? atmos_intercept.x : 0.0;
  }
  if(length(ro) < atmosphereRadiusMM) {
    mindist = 0.0;
  }

  if(length(ro) < groundRadiusMM) {
    // start on ground and end in atmosphere top
    mindist = terra_intercept;
  }

  vec3 rayStart = ro + mindist * rd;
  float tMax = maxdist - mindist;
  vec3 sky_radiance;
  raymarchScattering(rayStart, rd, iSunDirection, tMax, 8., transmittance, sky_radiance, in_scatter);
  #else
  float iDepth = (dist / aerialLutStep) - 1.;

  // calculate the distance to the camera in kilometers
  float t = iDepth / (aerialLutRes - 1.);    // Normalize the distance
  t = clamp(t, 0.0, 1.0);             // Clamp to the range [0, 1]

  // Calculate screen space UV coordinates from the fragment's position
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  vec3 uvw;
  uvw.xy = uv;
  uvw.z = t;

  // aerial perspective LUT
  vec4 aerialSample = texture(iAerialPerspective, uvw);
  // in-scattering from the current position to the camera
  in_scatter = aerialSample.rgb;
  // accumulated transmittance from the current position to the camera
  transmittance = vec3(aerialSample.a);
  #endif

  float shadow = getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);

  // TODO: fixed step raymarch towards the geometry
  // to determine the in-scattering from the current position to the camera
  // for atmospheric light shafts / sun rays

  vec3 sun_transmittance = getValFromTLUT(iTransmittance, iResolution.xy, pos, iSunDirection);
  vec3 direct_irradiance = sun_transmittance * solar_irradiance * max(dot(normal, iSunDirection), 0.0) * shadow;
  vec3 irradiance = getValFromIrradianceLUT(iIrradiance, iResolution.xy, pos, iSunDirection);
  vec3 sky_irradiance = irradiance * (1.0 + dot(normal, pos) / length(pos)) * 0.5;
  vec3 ambient_occlusion = vec3(1.0); // TODO pbr maps
  vec3 indirect_irradiance = sky_irradiance * ambient_occlusion;

  // lambertian
  outgoingLight = albedo * (1.0 / pi) * (direct_irradiance + indirect_irradiance);

  // aerial perspective
  outgoingLight *= transmittance;
  outgoingLight += in_scatter;
}