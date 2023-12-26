uniform sampler2D iTransmittance;
uniform sampler2D iMultiScattering;
uniform sampler2D iScenePost;
uniform vec3 iResolution;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  // gl_FragColor = texture2D(iTransmittance, uv);
  // gl_FragColor = texture2D(iMultiScattering, uv);
  gl_FragColor = texture2D(iScenePost, uv);

  #include <tonemapping_fragment>
  gl_FragColor = linearToOutputTexel(gl_FragColor);

  // gl_FragColor = vec4(uv, 0.0, 1.0);
}