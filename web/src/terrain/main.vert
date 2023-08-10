#include fbm
#include common

uniform sampler2D iTerrainTexture;
uniform float iTime;

out vec2 vUv;
out vec3 vPosition;

float displacementT(vec2 uv) {
  vec4 color = texture2D(iTerrainTexture, uv);
  float terrainHeight = (-10000. + (256. * 256. * 256. * color.r + 256. * 256. * color.g + 256. * color.b) * .1);
  return terrainHeight / 1000.; // in km
}

void main() {
  vUv = uv;
  vec3 pos = position;
  pos.z = displacementT(uv);

  vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}