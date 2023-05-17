#include ../sky/uniforms
#include ../sky/common
#include ../sky/ray

in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

void main() {
  vec3 color;

  vec3 ro, rd;
  cameraRay(ro, rd);

  // inscatter and transittance at the current position
  vec3 lutRes = vec3(32.);
  float t = sin(iTime) * 0.5 + 0.5;
  vec3 uvw = vec3(vUv, t);
  vec4 col = texture(iAerialPerspective, uvw);

  vec4 fragColor;
  fragColor.rgb = col.rgb * iExposure;
  fragColor.a = 1.0;
  gl_FragColor = fragColor;
}