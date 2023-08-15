#include ../sky/uniforms
#include ../sky/common
#include ../sky/ray
#include ../sky/raymarch

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
  // rotate on x axis -pi/2
  n = vec3(n.x, n.z, -n.y);
  return n;
}

// #define USE_LUT

void main() {
  vec3 ro, rd;
  cameraRay(ro, rd);
  vec3 normal = getNormal(vPosition, vUv);
  vec3 pos = transformPosition(vPosition);
  // Calculate the distance from the camera to the current fragment position
  float dist = length(pos - ro);

  vec3 transmittance, in_scatter, sky_irradiance;

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

  // calculate the indirect irradiance 
  // which is the sky light that is scattered into the current position taking into account
  // ambient occlusion and the sky luminance
  vec3 irradiance = getValFromIrradianceLUT(iIrradiance, iResolution.xy, pos, iSunDirection);
  float r = length(pos);
  sky_irradiance = irradiance * (1.0 + dot(normal, pos) / r) * 0.5;
  vec3 ambient_occlusion = vec3(1.0); // TODO pbr maps
  vec3 indirect_irradiance = sky_irradiance * ambient_occlusion;

  // get the transmittance to the sun
  vec3 sun_transmittance = getValFromTLUT(iTransmittance, iResolution.xy, pos, iSunDirection);

  // get the direct irradiance from the sun
  vec3 direct_irradiance = sun_transmittance * solar_irradiance * max(dot(normal, iSunDirection), 0.0);

  // TODO: factor in sun disc visibility

  // TODO: PBR maps here
  vec3 albedo = texture(iAlbedoTexture, vUv).rgb;

  vec3 radiance = albedo * (1.0 / pi) * (indirect_irradiance + direct_irradiance);
  radiance *= transmittance;
  radiance += in_scatter;

  vec4 fragColor;
  fragColor.rgb = radiance;
  fragColor.a = 1.0;

  // fragColor.rgb = vPosition / 13.;
  // fragColor.rgb = normal * .5 + .5;

  gl_FragColor = fragColor;

  #include <tonemapping_fragment>
  gl_FragColor = LinearTosRGB(gl_FragColor);
}