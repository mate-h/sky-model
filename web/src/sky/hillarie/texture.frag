uniform sampler2D iTransmittance;
uniform sampler2D iMultiScattering;
uniform sampler2D iScenePost;
uniform sampler2D iDepthBuffer;
uniform vec3 iResolution;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  // HDR textures
  // gl_FragColor = texture(iTransmittance, uv);
  // gl_FragColor = texture(iMultiScattering, uv);
  gl_FragColor = texture(iScenePost, uv);

  #include <tonemapping_fragment>
  gl_FragColor = linearToOutputTexel(gl_FragColor);

  // LDR and depth textures
  // gl_FragColor = vec4(vec3(texture(iDepthBuffer, uv).r), 1.0);

  // gl_FragColor = vec4(uv, 0.0, 1.0);
}