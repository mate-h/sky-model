#include uniforms
#include common

// Number of steps for the numerical integration when computing the irradiance.
const float IRRADIANCE_INTEGRATION_STEPS = 50.0;

vec3 computeIrradiance(vec3 pos, vec3 sunDir) {
  vec3 irradiance = vec3(0.0);
  float dt = 1.0 / IRRADIANCE_INTEGRATION_STEPS;

  vec3 rayleighScattering_prev, extinction_prev;
  float mieScattering_prev;
  getScatteringValues(pos, rayleighScattering_prev, mieScattering_prev, extinction_prev);

  for(float i = 1.0; i <= IRRADIANCE_INTEGRATION_STEPS; i += 1.0) {
    float newT = i * dt;
    vec3 newPos = pos + newT * sunDir;

    vec3 rayleighScattering, extinction;
    float mieScattering;
    getScatteringValues(newPos, rayleighScattering, mieScattering, extinction);

    vec3 transmittance = exp(-newT * extinction);
    irradiance += transmittance * (rayleighScattering + mieScattering + rayleighScattering_prev + mieScattering_prev) * dt / 2.0;

    rayleighScattering_prev = rayleighScattering;
    mieScattering_prev = mieScattering;
    extinction_prev = extinction;
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

  fragColor = vec4(computeIrradiance(pos, sunDir), 1.0);

  fragColor.rgb = vec3(0.);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
