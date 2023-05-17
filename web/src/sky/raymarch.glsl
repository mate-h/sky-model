void raymarchScattering(
  vec3 pos,
  vec3 rayDir,
  vec3 sunDir,
  float tMax,
  float numSteps,
  out vec3 transmittance,
  out vec3 skyLuminance,
  out vec3 inscattering
) {
  float cosTheta = dot(rayDir, sunDir);

  float miePhaseValue = getMiePhase(cosTheta);
  float rayleighPhaseValue = getRayleighPhase(-cosTheta);

  skyLuminance = vec3(0.0);
  transmittance = vec3(1.0);
  inscattering = vec3(0.0);
  float t = 0.0;
  for(float i = 0.0; i < numSteps; i += 1.0) {
    float newT = ((i + 0.3) / numSteps) * tMax;
    float dt = newT - t;
    t = newT;

    vec3 newPos = pos + t * rayDir;

    vec3 rayleighScattering, extinction;
    float mieScattering;
    getScatteringValues(newPos, rayleighScattering, mieScattering, extinction);

    vec3 sampleTransmittance = exp(-dt * extinction);

    vec3 sunTransmittance = getValFromTLUT(iTransmittance, iResolution.xy, newPos, sunDir);
    vec3 psiMS = getValFromMultiScattLUT(iScattering, iResolution.xy, newPos, sunDir);

    vec3 rayleighInScattering = rayleighScattering * (rayleighPhaseValue * sunTransmittance + psiMS);
    vec3 mieInScattering = mieScattering * (miePhaseValue * sunTransmittance + psiMS);
    vec3 inScattering = (rayleighInScattering + mieInScattering);

    // Integrated scattering within path segment.
    vec3 scatteringIntegral = (inScattering - inScattering * sampleTransmittance) / extinction;

    // accumulate sky luminance along view ray
    skyLuminance += scatteringIntegral * transmittance;

    // accumulate the total inscattered light along view ray for aerial perspective
    inscattering += inScattering * dt;

    // Accumulate transmittance
    transmittance *= sampleTransmittance;
  }
}