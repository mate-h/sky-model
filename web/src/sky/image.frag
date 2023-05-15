#include uniforms
#include common
#include ray

vec3 getValFromSkyLUT(vec3 rayDir, vec3 sunDir) {
  float height = length(viewPos);
  vec3 up = viewPos / height;

  float horizonAngle = safeacos(sqrt(height * height - groundRadiusMM * groundRadiusMM) / height);
  float altitudeAngle = horizonAngle - acos(dot(rayDir, up)); // Between -PI/2 and PI/2
  float azimuthAngle; // Between 0 and 2*PI
  if(abs(altitudeAngle) > (0.5 * PI - .0001)) {
        // Looking nearly straight up or down.
    azimuthAngle = 0.0;
  } else {
    vec3 right = cross(sunDir, up);
    vec3 forward = cross(up, right);

    vec3 projectedDir = normalize(rayDir - up * (dot(rayDir, up)));
    float sinTheta = dot(projectedDir, right);
    float cosTheta = dot(projectedDir, forward);
    azimuthAngle = atan(sinTheta, cosTheta) + PI;
  }

  // Non-linear mapping of altitude angle. See Section 5.3 of the paper.
  float v = 0.5 + 0.5 * sign(altitudeAngle) * sqrt(abs(altitudeAngle) * 2.0 / PI);
  vec2 uv = vec2(azimuthAngle / (2.0 * PI), v);
  uv *= skyLUTRes;
  uv /= iResolution.xy;

  return texture(iSkyview, uv).rgb;
}

vec3 sunWithBloom(vec3 rayDir, vec3 sunDir) {
  const float sunSolidAngle = 0.53 * PI / 180.0;
  const float minSunCosTheta = cos(sunSolidAngle);

  float cosTheta = dot(rayDir, sunDir);
  if(cosTheta >= minSunCosTheta)
    return vec3(1.0);

  float offset = minSunCosTheta - cosTheta;
  float gaussianBloom = exp(-offset * 50000.0) * 0.5;
  float invBloom = 1.0 / (0.02 + offset * 300.0) * 0.01;
  return vec3(gaussianBloom + invBloom);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec3 sunDir = getSunDir(iTime);

  // determine the ray direction
  vec3 rayOrigin, rayDir;
  cameraRay(rayOrigin, rayDir);

  vec3 lum = getValFromSkyLUT(rayDir, sunDir);

  // Bloom should be added at the end, but this is subtle and works well.
  vec3 sunLum = sunWithBloom(rayDir, sunDir);
  // Use smoothstep to limit the effect, so it drops off to actual zero.
  sunLum = smoothstep(0.002, 1.0, sunLum);
  if(length(sunLum) > 0.0) {
    if(rayIntersectSphere(viewPos, rayDir, groundRadiusMM) >= 0.0) {
      sunLum *= 0.0;
    } else {
      // If the sun value is applied to this pixel, we need to calculate the transmittance to obscure it.
      sunLum *= getValFromTLUT(iTransmittance, iResolution.xy, viewPos, sunDir);
    }
  }
  lum += sunLum;

  // Exposure
  lum *= 20.0;

  fragColor = vec4(lum, 1.0);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);

  #include <tonemapping_fragment>
}