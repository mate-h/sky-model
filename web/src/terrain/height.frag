uniform sampler2D iTerrainTexture;

in vec3 vPosition;

float displacementT(vec2 uv) {
  vec4 color = texture2D(iTerrainTexture, uv);
  float terrainHeight = (-10000. + (256. * 256. * 256. * color.r + 256. * 256. * color.g + 256. * color.b) * .1);
  return terrainHeight / 1000.; // in km
}

void main() {
  // put the terrainHeight in gl_FragColor
  vec2 uv = (vPosition.xy + 1.) * .5;
  float d = displacementT(uv);
  gl_FragColor = vec4(d, d, d, 1.);
}