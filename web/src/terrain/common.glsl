float fdisplacement(vec2 uv) {
  vec2 scaledUv = uv * vec2(5.);
  return fbm(scaledUv, vec2(10.)) * 2.;
}

float sindisplacement(vec2 uv) {
  vec2 scaledUv = uv * vec2(5.);
  // simple sine wave
  float x = sin(scaledUv.x * 10.) * 0.1;
  float y = sin(scaledUv.y * 10.) * 0.1;
  return (x + y) * 2.;
}

float displacement(vec2 uv) {
  return fdisplacement(uv);
}