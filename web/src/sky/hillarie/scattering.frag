#include common
#include earth
#include integrate

vec3 approximateHemisphereIntegration(vec2 pixPos, vec3 WorldPos, vec3 sunDir, AtmosphereParameters Atmosphere) {
  const bool ground = true;
  const float SampleCountIni = 20.;// a minimum set of step is required for accuracy unfortunately
  const float DepthBufferValue = -1.0;
  const bool VariableSampleCount = false;
  const bool MieRayPhase = false;

  const float SphereSolidAngle = 4.0 * PI;
  const float IsotropicPhase = 1.0 / SphereSolidAngle;

  const int sqrtSamples = 8;  // Number of samples in each dimension
  vec3 accumulatedLum = vec3(0.0);
  vec3 accumulatedFms = vec3(0.0);

  for(int i = 0; i < sqrtSamples; ++i) {
    for(int j = 0; j < sqrtSamples; ++j) {
      // Approximate hemisphere sampling
      float theta = PI * (float(i) + 0.5) / float(sqrtSamples);
      float phi = 2.0 * PI * (float(j) + 0.5) / float(sqrtSamples);

      vec3 sampleDir = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));

      SingleScatteringResult result = IntegrateScatteredLuminance(pixPos, WorldPos, sampleDir, sunDir, Atmosphere, ground, SampleCountIni, DepthBufferValue, VariableSampleCount, MieRayPhase, defaultTMaxMax, iResolution);
      accumulatedLum += result.L;
      accumulatedFms += result.MultiScatAs1;
    }
  }

  vec3 MultiScatAs1 = accumulatedFms * IsotropicPhase;  // Equation 7 f_ms
  vec3 InScatteredLuminance = accumulatedLum * IsotropicPhase; // Equation 5 L_2ndOrder

  // Equation 10
#if	MULTI_SCATTERING_POWER_SERIE==0
	vec3 MultiScatAs1SQR = MultiScatAs1 * MultiScatAs1;
	vec3 L = InScatteredLuminance * (1.0 + MultiScatAs1 + MultiScatAs1SQR + MultiScatAs1 * MultiScatAs1SQR + MultiScatAs1SQR * MultiScatAs1SQR);
#else
	// For a serie, sum_{n=0}^{n=+inf} = 1 + r + r^2 + r^3 + ... + r^n = 1 / (1.0 - r), see https://en.wikipedia.org/wiki/Geometric_series 
	vec3 r = MultiScatAs1;
	vec3 SumOfAllMultiScatteringEventsContribution = 1.0f / (1.0 - r);
	vec3 L = InScatteredLuminance * SumOfAllMultiScatteringEventsContribution;// Equation 10 Psi_ms
#endif

  return L;
}

void NewMultiScattCS(in vec2 fragCoord, out vec4 fragColor) {
  vec2 pixPos = gl_FragCoord.xy + 0.5;
  vec2 uv = pixPos / MultiScatteringLUTRes;

  AtmosphereParameters Atmosphere = GetAtmosphereParameters();

  float sunCosTheta = uv.x * 2.0 - 1.0;
  vec3 sunDir = vec3(0.0, sqrt(1.0 - sunCosTheta * sunCosTheta), sunCosTheta);
  float viewHeight = Atmosphere.BottomRadius + clamp(uv.y, 0.0, 1.0) * (Atmosphere.TopRadius - Atmosphere.BottomRadius);

  vec3 WorldPos = vec3(0.0, 0.0, viewHeight);

  vec3 psi = approximateHemisphereIntegration(pixPos, WorldPos, sunDir, Atmosphere);
  gl_FragColor = vec4(psi, 1.0);
}

void main() {
  NewMultiScattCS(gl_FragCoord.xy, gl_FragColor);
}