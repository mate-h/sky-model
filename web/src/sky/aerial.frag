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

  // calculate the start and end of the corresponding view ray segment
  // tmin and tmax are the distances to the near and far planes of the view frustum
  float tmin = 0.0;

  // units are in megameters
  float tmax = aerialLutRange; // 32 km 

  // generate vector along the view ray at intervals of 1 km
  // iDepth is the current depth of the LUT goes from 0 to res.z - 1
  // u ranges from 1./res.z - 1 to 1.

  float t = (iDepth + 1.0) * aerialLutStep;

  vec3 transmittance, luminance, inscattering;
  raymarchScattering(ro, rd, iSunDirection, t, float(numScatteringSteps), transmittance, luminance, inscattering);
  // Store the in-scattering in the RGB channels of the texture and the transmittance in the A channel
  // The luminance is used to calculate the average luminance of the atmosphere
  vec4 fragColor;
  fragColor.rgb = inscattering;

  vec3 tt = transmittance;
  fragColor.a = (tt.r + tt.g + tt.b) / 3.0;

  gl_FragColor = fragColor;
}
