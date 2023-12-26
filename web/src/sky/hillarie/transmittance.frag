#include common
#include earth
#include integrate

// Assuming the input struct and output layout locations are appropriately defined

void UvToLutTransmittanceParams(AtmosphereParameters Atmosphere, out float viewHeight, out float viewZenithCosAngle, in vec2 uv) {
  float x_mu = uv.x;
  float x_r = uv.y;

  float H = sqrt(Atmosphere.TopRadius * Atmosphere.TopRadius - Atmosphere.BottomRadius * Atmosphere.BottomRadius);
  float rho = H * x_r;
  viewHeight = sqrt(rho * rho + Atmosphere.BottomRadius * Atmosphere.BottomRadius);

  float d_min = Atmosphere.TopRadius - viewHeight;
  float d_max = rho + H;
  float d = d_min + x_mu * (d_max - d_min);
  viewZenithCosAngle = d == 0.0 ? 1.0 : (H * H - rho * rho - d * d) / (2.0 * viewHeight * d);
  viewZenithCosAngle = clamp(viewZenithCosAngle, -1.0, 1.0);
}

void RenderTransmittanceLutPS(in vec2 pixPos, out vec4 fragColor) {
  AtmosphereParameters Atmosphere = GetAtmosphereParameters();

  // Compute camera position from LUT coords
  vec2 uv = pixPos / vec2(TRANSMITTANCE_TEXTURE_WIDTH, TRANSMITTANCE_TEXTURE_HEIGHT);
  float viewHeight;
  float viewZenithCosAngle;
  UvToLutTransmittanceParams(Atmosphere, viewHeight, viewZenithCosAngle, uv);

  // A few extra needed constants
  vec3 WorldPos = vec3(0.0, 0.0, viewHeight);
  vec3 WorldDir = vec3(0.0, sqrt(1.0 - viewZenithCosAngle * viewZenithCosAngle), viewZenithCosAngle);

  const bool ground = false;
  const float SampleCountIni = 40.0;  // Can go as low as 10 samples but energy lost starts to be visible.
  const float DepthBufferValue = -1.0;
  const bool VariableSampleCount = false;
  const bool MieRayPhase = false;
  vec3 transmittance = exp(-IntegrateScatteredLuminance(pixPos, WorldPos, WorldDir, iSunDirection, Atmosphere, ground, SampleCountIni, DepthBufferValue, VariableSampleCount, MieRayPhase, defaultTMaxMax, iResolution).OpticalDepth);

  // Optical depth to transmittance
  fragColor = vec4(transmittance, 1.0);
}

void main() {
  RenderTransmittanceLutPS(gl_FragCoord.xy, gl_FragColor);
}

// void mainImage(out vec4 fragColor, in vec2 fragCoord) {
//   AtmosphereParameters parameters = GetAtmosphereParameters();
//   fragColor.rgb = ComputeTransmittanceToTopAtmosphereBoundaryTexture(parameters, fragCoord.xy);
//   fragColor.a = 1.0;
// }

// void main() {
//   mainImage(gl_FragColor, gl_FragCoord.xy);
// }