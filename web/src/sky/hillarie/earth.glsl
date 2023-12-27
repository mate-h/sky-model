AtmosphereParameters GetAtmosphereParameters() {
  AtmosphereParameters info;

  const float EarthBottomRadius = 6360.0;
  float scalar = (iValue + 0.1) * 10.;
  float EarthTopRadius = EarthBottomRadius + 100. * scalar;
  float EarthRayleighScaleHeight = 8.0 * scalar;
  float EarthMieScaleHeight = 1.2 * scalar;

  info.BottomRadius = EarthBottomRadius;
  info.TopRadius = EarthTopRadius;
  info.GroundAlbedo = vec3(1.);

  info.RayleighDensityExpScale = -1.0 / EarthRayleighScaleHeight;
  info.RayleighScattering = vec3(0.005802, 0.013558, 0.033100);

  info.MieDensityExpScale = -1.0 / EarthMieScaleHeight;
  info.MieScattering = vec3(0.003996, 0.003996, 0.003996);
  info.MieExtinction = vec3(0.004440, 0.004440, 0.004440);
  info.MieAbsorption = info.MieExtinction - info.MieScattering;
  info.MiePhaseG = 0.8;

  info.AbsorptionDensity0LayerWidth = 25.0 * scalar;
  info.AbsorptionDensity0ConstantTerm = -2.0 / 3.0;
  info.AbsorptionDensity0LinearTerm = 1.0 / (15.0 * scalar);
  info.AbsorptionDensity1ConstantTerm = 8.0 / 3.0;
  info.AbsorptionDensity1LinearTerm = -1.0 / (15.0 * scalar);
  info.AbsorptionExtinction = vec3(0.000650, 0.001881, 0.000085);

  // Omitting solar irradiance and sun angular radius as they are not part of the struct

  return info;
}

MediumSampleRGB sampleMediumRGB(in vec3 WorldPos, in AtmosphereParameters Atmosphere) {
  float viewHeight = length(WorldPos) - Atmosphere.BottomRadius;

  float densityMie = exp(Atmosphere.MieDensityExpScale * viewHeight);
  float densityRay = exp(Atmosphere.RayleighDensityExpScale * viewHeight);
  float densityOzo = clamp(viewHeight < Atmosphere.AbsorptionDensity0LayerWidth ? Atmosphere.AbsorptionDensity0LinearTerm * viewHeight + Atmosphere.AbsorptionDensity0ConstantTerm : Atmosphere.AbsorptionDensity1LinearTerm * viewHeight + Atmosphere.AbsorptionDensity1ConstantTerm, 0.0, 1.0);

  MediumSampleRGB s;

  s.scatteringMie = densityMie * Atmosphere.MieScattering;
  s.absorptionMie = densityMie * Atmosphere.MieAbsorption;
  s.extinctionMie = densityMie * Atmosphere.MieExtinction;

  s.scatteringRay = densityRay * Atmosphere.RayleighScattering;
  s.absorptionRay = vec3(0.0);
  s.extinctionRay = s.scatteringRay + s.absorptionRay;

  s.scatteringOzo = vec3(0.0);
  s.absorptionOzo = densityOzo * Atmosphere.AbsorptionExtinction;
  s.extinctionOzo = s.scatteringOzo + s.absorptionOzo;

  s.scattering = s.scatteringMie + s.scatteringRay + s.scatteringOzo;
  s.absorption = s.absorptionMie + s.absorptionRay + s.absorptionOzo;
  s.extinction = s.extinctionMie + s.extinctionRay + s.extinctionOzo;
  s.albedo = getAlbedo(s.scattering, s.extinction); // Make sure getAlbedo is defined in GLSL

  return s;
}
