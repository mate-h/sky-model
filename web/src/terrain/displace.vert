// displacement shader with an input terrain rgb texture

uniform sampler2D iTerrainTexture;

out vec3 vNormal;
out vec3 vPosition;
out vec2 vUv;

const float terrainScalar = 10000.;
float displacement(vec2 uv) {
  vec4 color = texture2D(iTerrainTexture, uv);
  float terrainHeight = (terrainScalar + (256. * 256. * 256. * color.r + 256. * 256. * color.g + 256. * color.b) * .1) / terrainScalar;
  return terrainHeight;
}


void main() {
  vUv = uv;
  vec3 pos = position;

  const float tex = 1. / 128.;
  vec3 p1 = pos + vec3(tex, 0, displacement(uv + vec2(tex, 0)));
  vec3 p2 = pos + vec3(0, tex, displacement(uv + vec2(0, tex)));
  vec3 p3 = pos + vec3(-tex, 0, displacement(uv + vec2(-tex, 0)));
  vec3 p4 = pos + vec3(0, -tex, displacement(uv + vec2(0, -tex)));
  vec3 n1 = normalize(cross(p1 - pos, p2 - pos));
  vec3 n2 = normalize(cross(p2 - pos, p3 - pos));
  vec3 n3 = normalize(cross(p3 - pos, p4 - pos));
  vec3 n4 = normalize(cross(p4 - pos, p1 - pos));
  vec3 n = normalize(n1 + n2 + n3 + n4);
  
  const float s = 1.;
  pos.z = displacement(uv) * s - (s * 2.);

  // apply model matrix to normal and position
  vNormal = normalize(mat3(modelMatrix) * n);
  vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}