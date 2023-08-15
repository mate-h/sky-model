#include uniforms
#include common
#include raymarch

vec3 computeIndirectIrradiance(vec3 pos, vec3 sunDir) {
  const int SAMPLE_COUNT = 8;
  const float dphi = pi / float(SAMPLE_COUNT);
  const float dtheta = pi / float(SAMPLE_COUNT);
  vec3 omega_s = vec3(sqrt(1.0 - sunDir.z * sunDir.z), 0.0, sunDir.z);
  vec3 irradiance = vec3(0.0);

  for (int j = 0; j < SAMPLE_COUNT / 2; ++j) {
    float theta = (float(j) + 0.5) * dtheta;
    for (int i = 0; i < 2 * SAMPLE_COUNT; ++i) {
      float phi = (float(i) + 0.5) * dphi;
      vec3 omega =
          vec3(cos(phi) * sin(theta), sin(phi) * sin(theta), cos(theta));
      float domega = (dtheta) * (dphi) * sin(theta);

      // Determine tMax for ray marching
      float tMax = rayIntersectScene(pos, omega);

      // Ray march along omega to compute transmittance, radiance, and inscattering
      vec3 transmittance, radiance, inscattering;
      raymarchScattering(pos, omega, sunDir, tMax, 8., transmittance, radiance, inscattering);

      // Use inscattering as the integrand
      irradiance += inscattering * omega.z * domega;
    }
  }

  return irradiance;
}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  if(fragCoord.x >= (irradianceLUTRes.x + 1.5) || fragCoord.y >= (irradianceLUTRes.y + 1.5)) {
    return;
  }
  float u = clamp(fragCoord.x, 0.0, irradianceLUTRes.x - 1.0) / irradianceLUTRes.x;
  float v = clamp(fragCoord.y, 0.0, irradianceLUTRes.y - 1.0) / irradianceLUTRes.y;

  float sunCosTheta = 2.0 * u - 1.0;
  float sunTheta = safeacos(sunCosTheta);
  float atmosphereRadiusMM = getAtmosphereSize();
  float height = mix(groundRadiusMM, atmosphereRadiusMM, v);

  vec3 pos = vec3(0.0, height, 0.0);
  vec3 sunDir = normalize(vec3(0.0, sunCosTheta, -sin(sunTheta)));

  fragColor = vec4(computeIndirectIrradiance(pos, sunDir), 1.0);

  // fragColor.rgb = vec3(0.);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
