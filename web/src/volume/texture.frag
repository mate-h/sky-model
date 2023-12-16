uniform sampler2D volume;
in vec2 vUv;
void main() {
  gl_FragColor = texture(volume, vUv);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}