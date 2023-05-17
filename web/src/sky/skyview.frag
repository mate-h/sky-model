#include uniforms
#include common
#include raymarch

// Buffer C calculates the actual sky-view! It's a lat-long map (or maybe altitude-azimuth is the better term),
// but the latitude/altitude is non-linear to get more resolution near the horizon.
const int numScatteringSteps = 32;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  if(fragCoord.x >= (skyLUTRes.x + 1.5) || fragCoord.y >= (skyLUTRes.y + 1.5)) {
    return;
  }
  float u = clamp(fragCoord.x, 0.0, skyLUTRes.x - 1.0) / skyLUTRes.x;
  float v = clamp(fragCoord.y, 0.0, skyLUTRes.y - 1.0) / skyLUTRes.y;

  float azimuthAngle = (u - 0.5) * 2.0 * PI;
  // Non-linear mapping of altitude. See Section 5.3 of the paper.
  float adjV;
  if(v < 0.5) {
    float coord = 1.0 - 2.0 * v;
    adjV = -coord * coord;
  } else {
    float coord = v * 2.0 - 1.0;
    adjV = coord * coord;
  }

  vec3 ro = getCameraPosition();
  float height = length(ro);
  vec3 up = ro / height;
  float horizonAngle = safeacos(sqrt(height * height - groundRadiusMM * groundRadiusMM) / height) - 0.5 * PI;
  float altitudeAngle = adjV * 0.5 * PI - horizonAngle;

  float cosAltitude = cos(altitudeAngle);
  vec3 rayDir = vec3(cosAltitude * sin(azimuthAngle), sin(altitudeAngle), -cosAltitude * cos(azimuthAngle));

  float atmoDist = rayIntersectSphere(ro, rayDir, atmosphereRadiusMM);
  float groundDist = rayIntersectSphere(ro, rayDir, groundRadiusMM);
  float tMax = (groundDist < 0.0) ? atmoDist : groundDist;
  vec3 transmittance, luminance, inscattering;
  raymarchScattering(ro, rayDir, iSunDirection, tMax, float(numScatteringSteps), transmittance, luminance, inscattering);
  fragColor = vec4(luminance, 1.0);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}