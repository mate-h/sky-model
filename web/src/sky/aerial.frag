#include uniforms
#include common
#include ray
#include raymarch

in vec2 vUv;
in vec3 vPosition;

const int numScatteringSteps = 32;

void main() {
  vec3 res = vec3(aerialLutRes);
  // (ro, rd) is the ray from the camera to the current pixel
  vec3 ro, rd;

  vec2 uv = gl_FragCoord.xy / res.xy;
  cameraRayUv(ro, rd, uv);

  // generate vector along the view ray at specified intervals
  float w = iDepth / (aerialLutRes - 1.0);
  float t = mix(0., (aerialLutRes - 1.0) * aerialLutStep, w);

  vec3 transmittance, radiance, inscattering;
  raymarchScattering(ro, rd, iSunDirection, t, float(numScatteringSteps), transmittance, radiance, inscattering);
  
  // Store the in-scattering in the RGB channels of the texture and the transmittance in the A channel
  vec4 fragColor;
  fragColor.rgb = inscattering;

  vec3 tt = transmittance;
  fragColor.a = (tt.r + tt.g + tt.b) / 3.0;

  gl_FragColor = fragColor;
}
