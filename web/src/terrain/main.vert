#include fbm

out vec2 vUv;
out vec3 vNormal;

float displacement(vec2 uv) {
  vec2 scaledUv = uv * vec2(5.);
  return fbm(scaledUv, vec2(10.)) * .3;
}

void main() {
  vUv = uv;
  vec3 pos = position;

  const float tex = 1. / 100.;
  vec3 p1 = pos + vec3(tex, 0, displacement(uv + vec2(tex, 0)));
  vec3 p2 = pos + vec3(0, tex, displacement(uv + vec2(0, tex)));
  vec3 p3 = pos + vec3(-tex, 0, displacement(uv + vec2(-tex, 0)));
  vec3 p4 = pos + vec3(0, -tex, displacement(uv + vec2(0, -tex)));
  vec3 n1 = normalize(cross(p1 - pos, p2 - pos));
  vec3 n2 = normalize(cross(p2 - pos, p3 - pos));
  vec3 n3 = normalize(cross(p3 - pos, p4 - pos));
  vec3 n4 = normalize(cross(p4 - pos, p1 - pos));
  vNormal = normalize(n1 + n2 + n3 + n4);
  pos.z = displacement(uv);

  // rotate normal
  vNormal = normalize(mat3(modelMatrix) * vNormal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}