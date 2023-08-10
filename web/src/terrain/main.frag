#include ../sky/uniforms
#include ../sky/common
#include ../sky/ray
#include ../sky/raymarch
#include fbm
#include common

in vec2 vUv;
in vec3 vPosition;

uniform sampler2D iAlbedoTexture;
uniform sampler2D iTerrainTexture;

float displacementT(vec2 uv) {
  vec4 color = texture2D(iTerrainTexture, uv);
  float terrainHeight = (-10000. + (256. * 256. * 256. * color.r + 256. * 256. * color.g + 256. * color.b) * .1);
  return terrainHeight / 1000.; // in km
}

vec3 getNormal(vec3 pos, vec2 uv) {
  const float tex = 1. / (514. * 2.);
  vec3 p1 = pos + vec3(tex, 0, displacementT(uv + vec2(tex, 0)));
  vec3 p2 = pos + vec3(0, tex, displacementT(uv + vec2(0, tex)));
  vec3 p3 = pos + vec3(-tex, 0, displacementT(uv + vec2(-tex, 0)));
  vec3 p4 = pos + vec3(0, -tex, displacementT(uv + vec2(0, -tex)));
  vec3 n1 = normalize(cross(p1 - pos, p2 - pos));
  vec3 n2 = normalize(cross(p2 - pos, p3 - pos));
  vec3 n3 = normalize(cross(p3 - pos, p4 - pos));
  vec3 n4 = normalize(cross(p4 - pos, p1 - pos));
  vec3 n = normalize(n1 + n2 + n3 + n4);
  // rotate on x axis -PI/2
  n = vec3(n.x, n.z, -n.y);
  return n;
}

// #define USE_LUT

void main() {
  vec3 color;

  vec3 ro, rd;
  cameraRay(ro, rd);

  vec3 normal = getNormal(vPosition, vUv);

  vec3 pos = transformPosition(vPosition);

  // Calculate the distance from the camera to the current fragment position
  float dist = length(pos - ro);

  float u = 0.001;
  float iDepth = (dist / aerialLutStep) - 1.0;

  // calculate the distance to the camera in kilometers
  float t = iDepth / (aerialLutRes - 1.);    // Normalize the distance
  t = clamp(t, 0.0, 1.0);             // Clamp to the range [0, 1]

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
  vec3 transmittance = vec3(col.a);

  vec3 sky_irradiance = getValFromIrradianceLUT(iIrradiance, iResolution.xy, pos, iSunDirection);

  #ifndef USE_LUT
  raymarchScattering(ro, rd, iSunDirection, dist, 8., transmittance, sky_irradiance, in_scatter);
  #endif

  // calculate the indirect irradiance 
  // which is the sky light that is scattered into the current position taking into account
  // ambient occlusion and the sky luminance
  vec3 ambient_occlusion = vec3(1.0);
  vec3 indirect_irradiance = sky_irradiance * ambient_occlusion;

  float r = length(pos);

  // get the transmittance to the sun
  vec3 sun_transmittance = getValFromTLUT(iTransmittance, iResolution.xy, pos, iSunDirection);

  // get the direct irradiance from the sun
  vec3 direct_irradiance = sun_transmittance * solar_irradiance * max(dot(normal, iSunDirection), 0.0);

  // TODO: factor in sun disc visibility

  // TODO: PBR maps here
  vec3 albedo = texture(iAlbedoTexture, vUv).rgb;

  vec3 radiance = albedo * (1.0 / PI) * (indirect_irradiance + direct_irradiance);

  radiance *= transmittance;
  radiance += in_scatter;

  vec4 fragColor;
  fragColor.rgb = radiance * iExposure;
  fragColor.a = 1.0;

  // output normal to fragColor
  // fragColor.rgb = normal * .5 + .5;

  gl_FragColor = fragColor;

  #include <tonemapping_fragment>
}