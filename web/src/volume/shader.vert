out vec2 vUv;
void main() {
  vUv = position.xy * .5 + .5;
  gl_Position = vec4(position, 1.);
}