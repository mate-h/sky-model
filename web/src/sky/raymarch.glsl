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

  vec3 previousScattering = vec3(0.0);
  float t = 0.0;
  float dt = tMax / numSteps;

  for(float i = 0.0; i <= numSteps; i += 1.0) {
    vec3 newPos = pos + t * rayDir;

    vec3 rayleighScattering, extinction;
    float mieScattering;
    getScatteringValues(newPos, rayleighScattering, mieScattering, extinction);

    vec3 sampleTransmittance = exp(-dt * extinction);

    vec3 sunTransmittance = getValFromTLUT(iTransmittance, iResolution.xy, newPos, sunDir);
    vec3 psiMS = getValFromMultiScattLUT(iScattering, iResolution.xy, newPos, sunDir);

    vec3 rayleighInScattering = rayleighScattering * (rayleighPhaseValue * sunTransmittance + psiMS);
    vec3 mieInScattering = mieScattering * (miePhaseValue * sunTransmittance + psiMS);
    vec3 currentScattering = (rayleighInScattering + mieInScattering);

    vec3 scatteringIntegral;
    if(extinction != vec3(0.0)) {
      scatteringIntegral = (previousScattering + currentScattering) * 0.5 * dt;
    } else {
      scatteringIntegral = vec3(0.0);
    }

    float weight = (i == 0.0 || i == numSteps) ? 0.5 : 1.0;
    skyLuminance += weight * scatteringIntegral * transmittance;
    inscattering += weight * currentScattering * dt;

    transmittance *= sampleTransmittance;

    previousScattering = currentScattering;

    t += dt;
  }
}
