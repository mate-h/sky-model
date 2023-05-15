uniform vec3 iResolution;
uniform sampler2D iSkyview;
uniform sampler2D iScattering;
uniform sampler2D iTransmittance;
in vec2 vUv;
void main() {
  gl_FragColor = texture(iSkyview, vUv);
  // gl_FragColor = texture(iScattering, vUv);
  // gl_FragColor = texture(iTransmittance, vUv);
  // gl_FragColor.rgb = vec3(vUv, 0.);
  // gl_FragColor.a = 1.;
}