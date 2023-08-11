uniform sampler2D iTerrainTexture;

in vec3 vPosition;

float displacementT(vec2 uv) {
  vec4 color = texture2D(iTerrainTexture, uv);
  float terrainHeight = (-10000. + (256. * 256. * 256. * color.r + 256. * 256. * color.g + 256. * color.b) * .1);
  return terrainHeight / 1000.; // in km
}

vec3 getNormal(vec3 pos, vec2 uv) {
  const float tex = 1. / (514. * 2.);
  vec3 p1 = pos + vec3(tex, 0, displacementT(uv + vec2(tex, 0)));
  vec3 p2 = pos + vec3(0, tex, displacementT(uv + vec2(0, tex)));
  vec3 p3 = pos + vec3(-tex, 0, displacementT(uv + vec2(-tex, 0)));
  vec3 p4 = pos + vec3(0, -tex, displacementT(uv + vec2(0, -tex)));
  vec3 n1 = normalize(cross(p1 - pos, p2 - pos));
  vec3 n2 = normalize(cross(p2 - pos, p3 - pos));
  vec3 n3 = normalize(cross(p3 - pos, p4 - pos));
  vec3 n4 = normalize(cross(p4 - pos, p1 - pos));
  vec3 n = normalize(n1 + n2 + n3 + n4);
  // rotate on x axis -PI/2
  // n = vec3(n.x, n.z, -n.y);
  return n;
}

void main() {
  // put the terrainHeight in gl_FragColor
  vec2 uv = (vPosition.xy + 1.) * .5;
  vec3 n = getNormal(vPosition, uv);
  gl_FragColor.rgb = n * .5 + .5;
  gl_FragColor.a = 1.;
}