#define OCTAVES 8
#define Seed 0xfffff

#define random(st) hashwithoutsine12(st)

float randomTrig(in vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

uint randomXOR_uint(uint state) {
  uint res = state;
  res ^= res << 13;
  res ^= res >> 7;
  res ^= res << 17;

  return res;
}

float randomXOR32(in vec2 st) {
  uint seedX = 31u * uint(Seed) + floatBitsToUint(1.0 + 3.0 * st.x);
  uint seedY = 17u * uint(Seed) + floatBitsToUint(31.0 + 17.0 * st.y);

  float rand = float(randomXOR_uint(randomXOR_uint(seedX) + seedY)) / float(0xffffffffu);
  return rand;
}

float hashwithoutsine12(vec2 p) {
  p = p * 0.152 + 50.0 + float(Seed);
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(in vec2 st, in vec2 dim) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  // Four corners in 2D of a tile
  float a = random(mod(i, dim));
  float b = random(mod(i + vec2(1.0, 0.0), dim));
  float c = random(mod(i + vec2(0.0, 1.0), dim));
  float d = random(mod(i + vec2(1.0, 1.0), dim));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
    (c - a) * u.y * (1.0 - u.x) +
    (d - b) * u.x * u.y;
}

float fbm(in vec2 st, in vec2 dim) {
  // Initial values
  float value = 0.0;
  float amplitude = .5;
  float frequency = 0.;

  // Loop of octaves
  for(int i = 0; i < OCTAVES; i++) {
    value += amplitude * noise(st, dim);
    st *= 2.0;
    dim *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}