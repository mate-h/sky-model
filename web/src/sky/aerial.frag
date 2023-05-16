#include uniforms
#include common
#include ray

void main() {
  vec3 res = vec3(32.);
  vec3 ro, rd;
  cameraRay(ro, rd, res);

  gl_FragColor = vec4(rd, 1.0);
}