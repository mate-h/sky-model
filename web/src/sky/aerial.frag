#include uniforms
#include common
#include ray
#include raymarch

const int numScatteringSteps = 32;

void main() {
  vec3 res = vec3(32.);
  // (ro, rd) is the ray from the camera to the current pixel
  vec3 ro, rd;
  cameraRay(ro, rd, res);

  // calculate the start and end of the corresponding view ray segment
  // tmin and tmax are the distances to the near and far planes of the view frustum
  float tmin = 0.0;
  // units are in megameters
  float tmax = .032; // 32 km 

  // unit vector along the view ray
  float u = 1. / res.z;
  
  // uniform iDepth is the current depth of the LUT
  float t = tmin + (tmax - tmin) * u * iDepth;
  
  // ro + rd * t is the point along the ray at distance t from the camera
  vec3 pos = ro + rd * t;

  vec3 transmittance, luminance, inscattering;
  raymarchScattering(pos, rd, iSunDirection, t, float(numScatteringSteps), transmittance, luminance, inscattering);
  // Store the in-scattering in the RGB channels of the texture and the transmittance in the A channel
  // The luminance is used to calculate the average luminance of the atmosphere
  vec4 fragColor;
  fragColor.rgb = inscattering;

  // float tMax = rayIntersectScene(pos, rd);
  // raymarchScattering(pos, rd, iSunDirection, tMax, float(numScatteringSteps), transmittance, luminance, inscattering);

  vec3 tt = transmittance;
  fragColor.a = (tt.r + tt.g + tt.b) / 3.0;

  gl_FragColor = fragColor;
}
