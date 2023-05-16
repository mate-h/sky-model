#include uniforms
#include common
#include ray

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float w = sin(iTime) * 0.5 + 0.5;
  vec3 uvw = vec3(uv, w);

  gl_FragColor = texture(iAerialPerspective, uvw);
  vec3 ro, rd;
  cameraRay(ro, rd);
  
  // gl_FragColor = vec4(rd, 1.);
}