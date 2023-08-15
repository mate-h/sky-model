#include ../sky/uniforms
#include ../sky/common
#include ../sky/ray
#include ../sky/raymarch

in vec2 vUv;
in vec3 vWorldPosition;

void applySkyLighting(in vec3 albedo, in vec3 normal, inout vec4 outgoingLight) {// inout ReflectedLight reflectedLight) {

  return;
  
  vec3 ro, rd;
  cameraRay(ro, rd);
  vec3 pos = transformPosition(vWorldPosition);
  float dist = length(pos - ro);
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
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
  if (length(ro) < groundRadiusMM) {
    mindist = terra_intercept;
  }
  vec3 rayStart = ro + mindist * rd;
  float tMax = maxdist - mindist;
  vec3 transmittance, sky_irradiance, in_scatter;
  raymarchScattering(rayStart, rd, iSunDirection, tMax, 8., transmittance, sky_irradiance, in_scatter);
  vec3 sun_transmittance = getValFromTLUT(iTransmittance, iResolution.xy, pos, iSunDirection);
  vec3 sun_irradiance = sun_transmittance * solar_irradiance * max(dot(normal, iSunDirection), 0.0);

  // reflectedLight.directSpecular = vec3(0.);
  // reflectedLight.indirectSpecular = vec3(0.);
  // reflectedLight.directDiffuse = vec3(0.);
  // reflectedLight.indirectDiffuse = vec3(0.);
  // outgoingLight = albedo * (1.0 / pi) * (sun_irradiance + sky_irradiance);
  // // outgoingLight = albedo * (1.0 / pi) * sky_irradiance * transmittance;
  // outgoingLight.rgb = albedo * (1.0 / pi) * (sun_irradiance);
  // outgoingLight.rgb *= transmittance;
  outgoingLight.rgb += in_scatter;

  // vec3 o = vec3(0.);
  // o = newPos;
  // o.g = 0.;
  // o = normal * 0.5 + 0.5;
  // o = vec3(vUv, 0.);

  // reflectedLight.directDiffuse = o;
  
  // modulate indirect lighting by ambient occlusion
}