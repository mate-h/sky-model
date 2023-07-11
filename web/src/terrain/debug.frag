#include ../sky/uniforms
#include ../sky/common
#include ../sky/ray
#include ../sky/raymarch

in vec3 vPosition;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec3 ro, rd;
  cameraRay(ro, rd);

  fragColor.rgb = rd;
  fragColor.rgb = vPosition;
  fragColor.a = 1.;
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}