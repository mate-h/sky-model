// float fdisplacement(vec2 uv) {
//   vec2 scaledUv = uv * vec2(5.);
//   return fbm(scaledUv, vec2(10.)) * 2.;
// }

float sindisplacement(vec2 uv) {
  vec2 scaledUv = uv * vec2(5.);
  // simple sine wave
  float x = sin(scaledUv.x * 10.);
  float y = sin(scaledUv.y * 10.);
  return ((x + y) + 2.) * .3;
}

float displacement(vec2 uv) {
  return sindisplacement(uv);
}

const float earthRadius = 1.;

const float pi = 3.1415926535897932384626433832795;
float tile2lon(float x, float z) {
  return x / pow(2., z) * 2. * pi - pi;
}

float tile2lat(float y, float z) {
  float n = pi - 2. * pi * y / pow(2., z);
  return atan(0.5 * (exp(n) - exp(-n)));
}

vec3 lngLatToEarth(float lng, float lat) {
  float x = earthRadius * cos(lat) * cos(lng);
  float y = earthRadius * sin(lat);
  float z = earthRadius * cos(lat) * sin(lng);
  return vec3(x, y, z);
}

vec3 worldTile(in vec3 tileCoords, in vec3 position) {
  // tile upper left corner in gl position space: [-1, 1]
  vec2 tileTopLeft = tileCoords.xy;
  // tile lower right corner in gl position space: [1, -1]
  vec2 tileBottomRight = tileCoords.xy + vec2(1.);

  vec2 p = position.xy;
  p = (p + 1.0) / 2.0;
  
  // interpolate position in tile space
  vec2 tilePos = mix(tileTopLeft, tileBottomRight, p);

  // reproject tile pos onto earth lng,lat
  float z = tileCoords.z;
  vec2 lnglat = vec2(tile2lon(tilePos.x, z), tile2lat(tilePos.y, z));

  // ECEF
  return lngLatToEarth(lnglat.x, lnglat.y);
}