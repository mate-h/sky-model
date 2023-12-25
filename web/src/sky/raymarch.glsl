void raymarchScattering(
  vec3 pos,
  vec3 rayDir,
  vec3 sunDir,
  float tMax,
  float numSteps,
  out vec3 transmittance,
  out vec3 radiance,
  out vec3 inscattering
) {
  float cosTheta = dot(rayDir, sunDir);

  float miePhaseValue = getMiePhase(cosTheta);
  float rayleighPhaseValue = getRayleighPhase(-cosTheta);

  #ifdef USE_MARS
    float dustPhaseValue = getMarsDustPhase(cosTheta);
  #endif

  radiance = vec3(0.0);
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
    #ifdef USE_MARS
      vec3 CO2Scattering, dustScattering;
      getMarsScatteringValues(newPos, CO2Scattering, dustScattering, extinction);
    #endif

    vec3 sampleTransmittance = exp(-dt * extinction);

    vec3 sunTransmittance = getValFromTLUT(iTransmittance, iResolution.xy, newPos, sunDir);
    vec3 psiMS = getValFromMultiScattLUT(iMultiScattering, iResolution.xy, newPos, sunDir);

    vec3 rayleighInScattering = rayleighScattering * (rayleighPhaseValue * sunTransmittance + psiMS);
    vec3 mieInScattering = mieScattering * (miePhaseValue * sunTransmittance + psiMS);
    vec3 currentScattering = (rayleighInScattering + mieInScattering);

    #ifdef USE_MARS
      // Assuming CO2 scattering is similar to Rayleigh
      vec3 CO2InScattering = CO2Scattering * (rayleighPhaseValue * sunTransmittance + psiMS);

      // Dust scattering might need a different phase function
      vec3 dustInScattering = dustScattering * (getMarsDustPhase(cosTheta) * sunTransmittance + psiMS);
      currentScattering = (CO2InScattering + dustInScattering);
    #endif

    vec3 scatteringIntegral;
    if(extinction != vec3(0.0)) {
      scatteringIntegral = (previousScattering + currentScattering) * 0.5 * dt;
    } else {
      scatteringIntegral = vec3(0.0);
    }

    float weight = (i == 0.0 || i == numSteps) ? 0.5 : 1.0;
    radiance += weight * scatteringIntegral * transmittance;
    inscattering += weight * currentScattering * dt * transmittance;

    transmittance *= sampleTransmittance;

    previousScattering = currentScattering;

    t += dt;
  }
}
