uniform vec3 iTileCoords;

#include "./common.glsl"

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;
out vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;

  // ECEF
  vWorldPosition = worldTile(iTileCoords, position);

  vec3 normal = normalize(vWorldPosition);
  vNormal = normal;

  // project towards camera
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vWorldPosition, 1.0);
}