in vec2 vUv;

float checker(vec2 uv) {
  float cx = floor(uv.x * 8.0);
  float cy = floor(uv.y * 8.0);
  float result = mod(cx + cy, 2.0);
  return result;
}

void main() {
  float c = checker(vUv);
  gl_FragColor = vec4(vec3(c * .1), 1.);
}
