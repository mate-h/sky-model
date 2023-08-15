const float pi = 3.14159265358;
// const float RAD = 180.0 / pi;

// Units are in megameters.
const float groundRadiusMM = 6.360;

float getAtmosphereSize() {
  float atmosphereSizeMM = iAtmosphereSize * 0.001;
  float atmosphereRadiusMM = 6.360 + atmosphereSizeMM;
  return atmosphereRadiusMM;
}

// on the north pole
const vec3 viewPos = vec3(0.0, groundRadiusMM, 0.0);
// 1 km per unit
const float viewScale = 0.001;
vec3 getCameraPosition() {
  return viewPos + cameraPosition * viewScale;
}

vec3 transformPosition(vec3 pos) {
  return viewPos + pos * viewScale;
}

// 4 km
const float aerialLutStep = 0.004;
const float aerialLutRes = 32.;

const vec2 tLUTRes = vec2(256.0, 64.0);
const vec2 msLUTRes = vec2(32.0, 32.0);
// Doubled the vertical skyLUT res from the paper, looks way
// better for sunrise.
const vec2 skyLUTRes = vec2(200.0, 200.0);
const vec2 irradianceLUTRes = vec2(128.0, 16.0);

const vec3 groundAlbedo = vec3(0.3);

// These are per megameter.
const vec3 rayleighScatteringBase = vec3(5.802, 13.558, 33.1);
const float rayleighAbsorptionBase = 0.0;

const float mieScatteringBase = 3.996;
const float mieAbsorptionBase = 4.4;

const vec3 ozoneAbsorptionBase = vec3(0.650, 1.881, .085);
const vec3 solar_irradiance = vec3(1.0, 1.0, 1.0);

float getMiePhase(float cosTheta) {
  const float g = 0.8;
  const float scale = 3.0 / (8.0 * pi);

  float num = (1.0 - g * g) * (1.0 + cosTheta * cosTheta);
  float denom = (2.0 + g * g) * pow((1.0 + g * g - 2.0 * g * cosTheta), 1.5);

  return scale * num / denom;
}

float getRayleighPhase(float cosTheta) {
  const float k = 3.0 / (16.0 * pi);
  return k * (1.0 + cosTheta * cosTheta);
}

void getScatteringValues(
  vec3 pos,
  out vec3 rayleighScattering, // sigma_rs
  out float mieScattering, // sigma_ms
  out vec3 extinction // sigma_e
) {
  float altitudeKM = (length(pos) - groundRadiusMM) * 1000.0;

  float scalar = iAtmosphereSize * 0.01;

  // Note: Paper gets these switched up.
  float rayleighDensity = exp(-altitudeKM / (8.0 * scalar));
  float mieDensity = exp(-altitudeKM / (1.2 * scalar));

  rayleighScattering = rayleighScatteringBase * rayleighDensity;
  float rayleighAbsorption = rayleighAbsorptionBase * rayleighDensity;

  mieScattering = mieScatteringBase * mieDensity;
  float mieAbsorption = mieAbsorptionBase * mieDensity;

  vec3 ozoneAbsorption = ozoneAbsorptionBase * max(0.0, 1.0 - abs(altitudeKM - (25.0 * scalar)) / (15.0 * scalar));

  extinction = rayleighScattering + rayleighAbsorption + mieScattering + mieAbsorption + ozoneAbsorption;
}

float safeacos(const float x) {
  return acos(clamp(x, -1.0, 1.0));
}

// From https://gamedev.stackexchange.com/questions/96459/fast-ray-sphere-collision-code.
float rayIntersectSphere(vec3 ro, vec3 rd, float rad) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - rad * rad;
  if(c > 0.0 && b > 0.0)
    return -1.0;
  float discr = b * b - c;
  if(discr < 0.0)
    return -1.0;
    // Special case: inside sphere, use far discriminant
  if(discr > b * b)
    return (-b + sqrt(discr));
  return -b - sqrt(discr);
}

vec2 rayIntersectSphere2D(
  vec3 start, // starting position of the ray
  vec3 dir, // the direction of the ray
  float radius // and the sphere radius
) {
  // ray-sphere intersection that assumes
  // the sphere is centered at the origin.
  // No intersection when result.x > result.y
  float a = dot(dir, dir);
  float b = 2.0 * dot(dir, start);
  float c = dot(start, start) - (radius * radius);
  float d = (b * b) - 4.0 * a * c;
  if(d < 0.0)
    return vec2(1e5, -1e5);
  return vec2((-b - sqrt(d)) / (2.0 * a), (-b + sqrt(d)) / (2.0 * a));
}

float rayIntersectScene(in vec3 ro, in vec3 rayDir) {
  float atmosphereRadiusMM = getAtmosphereSize();
  float atmoDist = rayIntersectSphere(ro, rayDir, atmosphereRadiusMM);
  float groundDist = rayIntersectSphere(ro, rayDir, groundRadiusMM);
  float tMax = (groundDist < 0.0) ? atmoDist : groundDist;
  return tMax;
}

/*
 * Same parameterization here.
 */
vec3 getValFromTLUT(sampler2D tex, vec2 bufferRes, vec3 pos, vec3 sunDir) {
  float atmosphereRadiusMM = getAtmosphereSize();
  float height = length(pos);
  vec3 up = pos / height;
  float sunCosZenithAngle = dot(sunDir, up);
  vec2 uv = vec2(tLUTRes.x * clamp(0.5 + 0.5 * sunCosZenithAngle, 0.0, 1.0), tLUTRes.y * max(0.0, min(1.0, (height - groundRadiusMM) / (atmosphereRadiusMM - groundRadiusMM))));
  uv /= bufferRes;
  return texture(tex, uv).rgb;
}

vec3 getValFromMultiScattLUT(sampler2D tex, vec2 bufferRes, vec3 pos, vec3 sunDir) {
  float atmosphereRadiusMM = getAtmosphereSize();
  float height = length(pos);
  vec3 up = pos / height;
  float sunCosZenithAngle = dot(sunDir, up);
  vec2 uv = vec2(msLUTRes.x * clamp(0.5 + 0.5 * sunCosZenithAngle, 0.0, 1.0), msLUTRes.y * max(0.0, min(1.0, (height - groundRadiusMM) / (atmosphereRadiusMM - groundRadiusMM))));
  uv /= bufferRes;
  return texture(tex, uv).rgb;
}

vec3 getValFromIrradianceLUT(sampler2D tex, vec2 bufferRes, vec3 pos, vec3 sunDir) {
  float atmosphereRadiusMM = getAtmosphereSize();
  float height = length(pos);
  vec3 up = pos / height;
  float sunCosZenithAngle = dot(sunDir, up);
  vec2 uv = vec2(irradianceLUTRes.x * clamp(0.5 + 0.5 * sunCosZenithAngle, 0.0, 1.0), irradianceLUTRes.y * max(0.0, min(1.0, (height - groundRadiusMM) / (atmosphereRadiusMM - groundRadiusMM))));
  uv /= bufferRes;
  return texture(tex, uv).rgb;
}

vec3 getValFromSkyLUT(sampler2D tex, vec2 bufferRes, vec3 rayDir, vec3 sunDir) {
  vec3 ro = getCameraPosition();
  float height = length(ro);
  vec3 up = ro / height;

  float horizonAngle = safeacos(sqrt(height * height - groundRadiusMM * groundRadiusMM) / height);
  float altitudeAngle = horizonAngle - acos(dot(rayDir, up)); // Between -pi/2 and pi/2
  float azimuthAngle; // Between 0 and 2*pi
  if(abs(altitudeAngle) > (0.5 * pi - .0001)) {
    // Looking nearly straight up or down.
    azimuthAngle = 0.0;
  } else {
    vec3 right = cross(sunDir, up);
    vec3 forward = cross(up, right);

    vec3 projectedDir = normalize(rayDir - up * (dot(rayDir, up)));
    float sinTheta = dot(projectedDir, right);
    float cosTheta = dot(projectedDir, forward);
    azimuthAngle = atan(sinTheta, cosTheta) + pi;
  }

  // Non-linear mapping of altitude angle. See Section 5.3 of the paper.
  float v = 0.5 + 0.5 * sign(altitudeAngle) * sqrt(abs(altitudeAngle) * 2.0 / pi);
  vec2 uv = vec2(azimuthAngle / (2.0 * pi), v);
  uv *= skyLUTRes;
  uv /= bufferRes;

  return texture(tex, uv).rgb;
}