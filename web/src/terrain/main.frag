#include ../sky/uniforms
#include ../sky/common
#include ../sky/ray
#include fbm
#include common

in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

void main() {
  vec3 color;

  vec3 lutRes = vec3(32.);
  vec3 ro, rd;
  cameraRay(ro, rd, lutRes);

  vec3 pos = transformPosition(vPosition);

  // Calculate the distance from the camera to the current fragment position
  float dist = length(pos - ro);

  // Clamp the distance to the maximum distance that the LUT represents
  float t = clamp(dist / 0.032, 0.0, 1.0); // 0.032 units are 32 kilometers

  // Calculate screen space UV coordinates from the fragment's position
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  vec3 uvw;
  uvw.xy = uv;
  uvw.z = t;

  // aerial perspective LUT
  vec4 col = texture(iAerialPerspective, uvw);

  // in-scattering from the current position to the camera
  vec3 in_scatter = col.rgb;

  // accumulated transmittance from the current position to the camera
  float transmittance = col.a;

  float r = length(pos);

  // TODO:
  // LUT sky irradiance at the current position  
  // calculate the indirect irradiance
  vec3 indirect_irradiance = vec3(0.);

  const vec3 solar_irradiance = vec3(1.474000, 1.850400, 1.911980);

  // get the transmittance to the sun
  vec3 sun_transmittance = getValFromTLUT(iTransmittance, iResolution.xy, pos, iSunDirection);

  // get the direct irradiance from the sun
  vec3 direct_irradiance = sun_transmittance * solar_irradiance * max(dot(vNormal, iSunDirection), 0.0);

  // TODO: PBR maps here
  vec3 albedo = vec3(0.1);

  vec3 radiance = albedo * (1.0 / PI) * (indirect_irradiance + direct_irradiance);

  radiance += in_scatter;
  radiance *= transmittance;

  vec4 fragColor;
  fragColor.rgb = radiance * iExposure;
  fragColor.a = 1.0;

  gl_FragColor = fragColor;

  // gl_FragColor = texture(iTransmittance, vUv);

  #include <tonemapping_fragment>
}