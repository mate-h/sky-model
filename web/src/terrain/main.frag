in vec2 vUv;
in vec3 vNormal;
uniform float time;
vec3 packNormalToRGB(const in vec3 normal) {
  return normalize(normal) * 0.5 + 0.5;
}
void main() {
  vec2 uv = vUv;
  vec3 color = vec3(0.0);
  vec2 center = vec2(0.5);
  float dist = distance(uv, center);
  color = vec3(dist);
  gl_FragColor = vec4(packNormalToRGB(vNormal), 1.0);
}