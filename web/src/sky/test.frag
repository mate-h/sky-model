#include uniforms
#include common
#include ray

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float w = sin(iTime) * 0.5 + 0.5;
  vec3 uvw = vec3(uv, w);
  
  // reference values
  vec3 ro, rd;
  cameraRay(ro, rd);

  // texture values
  vec4 value = texture(iAerialPerspective, uvw);
  // value = texture(iTransmittance, uv);
  // value = texture(iSkyview, uv);
  // value.a = 1.0;
  // value = texture(iSkyview, uv);
  vec3 rdd = value.xyz;

  // determine error
  float meanSquaredError = 0.0;
  // compare rd and rdd
  for (int i = 0; i < 3; i++) {
    float diff = rd[i] - rdd[i];
    meanSquaredError += diff * diff;
  }

  // exxagerate error
  meanSquaredError *= 200000.0;
  
  // plot error in gl_FragColor
  // gl_FragColor = vec4(vec3(meanSquaredError), 1.0);

  // plot texture value in gl_FragColor
  gl_FragColor = vec4(value.xyz * value.a * iExposure, value.a);

  #include <tonemapping_fragment>
}