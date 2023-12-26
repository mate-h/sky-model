const float pi = 3.14159265358;
// const float RAD = 180.0 / pi;

// Units are in megameters.
// 1 megameter = 1000 kilometers
// #define USE_MARS

#ifdef USE_MARS
  const float groundRadiusMM = 3.3895; // Mars' radius in megameters
#else
  const float groundRadiusMM = 6.360; // Earth's radius in megameters
#endif

float getAtmosphereSize() {
  float atmosphereSizeMM = iAtmosphereSize * 0.001;
  float atmosphereRadiusMM = groundRadiusMM + atmosphereSizeMM;
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

// These are per megameter.
const vec3 rayleighScatteringBase = vec3(5.802, 13.558, 33.1);
const float rayleighAbsorptionBase = 0.0;

const float mieScatteringBase = 3.996;
const float mieAbsorptionBase = 4.4;

const vec3 ozoneAbsorptionBase = vec3(0.650, 1.881, .085);

#ifdef USE_MARS
  const vec3 groundAlbedo = vec3(0.406683, 0.203038, 0.075251);
  const vec3 solar_irradiance = vec3(0.392, 0.559, 0.621); 
  // const vec3 solar_irradiance = vec3(1.0, 1.0, 1.0);
#else
  const vec3 groundAlbedo = vec3(0.3);
  const vec3 solar_irradiance = vec3(1.0, 1.0, 1.0);
#endif

// These are per megameter (example values, adjust based on actual data)
const vec3 CO2ScatteringBase = vec3(0.0897172, 0.0897172, 0.0897172); // Adjust for CO2
const vec3 dustScatteringBase = vec3(10.155, 10.155, 10.155); // Adjust for Martian dust
const vec3 DustAbsorptionBase = dustScatteringBase * vec3(1.0 - 0.94, 1.0 - 0.78, 1.0 - 0.63);
const vec3 CO2AbsorptionBase = vec3(0.0, 0.0, 0.0); // Adjust for Martian dust

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

float getMarsDustPhase(float cosTheta) {
  const float g = 0.64; // Example value, adjust based on actual data
  const float scale = 3.0 / (8.0 * pi);
  float num = (1.0 - g * g) * (1.0 + cosTheta * cosTheta);
  float denom = (2.0 + g * g) * pow((1.0 + g * g - 2.0 * g * cosTheta), 1.5);
  return scale * num / denom;
}

float getCO2Density(float altitudeKM, float atmosphereSizeFactor) {
  float scaleHeightCO2 = 10. * iValue * atmosphereSizeFactor; // Adjusted scale height for CO2
  // 1.0744578e24
  return 1. * exp(-altitudeKM / scaleHeightCO2);
}

float getDustDensity(float altitudeKM, float atmosphereSizeFactor) {
  float scaleHeightDust = 10.8 * atmosphereSizeFactor; // Adjusted scale height for dust
  // 4.559e6
  return 1. * exp(-altitudeKM / scaleHeightDust);
}

float getRayleighDensity(float altitudeKM, float atmosphereSizeFactor) {
  float rayleighScaleHeight = 8.0 * atmosphereSizeFactor; // in km
  // 3.08458e25
  return 1. * exp(-altitudeKM / rayleighScaleHeight);
}

float getMieDensity(float altitudeKM, float atmosphereSizeFactor) {
  float mieScaleHeight = 1.2 * atmosphereSizeFactor; // in km
  // 1.03333e8
  return 1. * exp(-altitudeKM / mieScaleHeight);
}

void getScatteringValues(
  vec3 pos,
  out vec3 rayleighScattering, // sigma_rs
  out float mieScattering, // sigma_ms
  out vec3 extinction // sigma_e
) {
  float altitudeKM = (length(pos) - groundRadiusMM) * 1000.0;

  float scalar = iAtmosphereSize * 0.01;

  float rayleighDensity = exp(-altitudeKM / (8.0 * scalar));
  float mieDensity = exp(-altitudeKM / (1.2 * scalar));
  // float rayleighDensity = getRayleighDensity(altitudeKM, scalar);
  // float mieDensity = getMieDensity(altitudeKM, scalar);

  rayleighScattering = rayleighScatteringBase * rayleighDensity;
  float rayleighAbsorption = rayleighAbsorptionBase * rayleighDensity;

  mieScattering = mieScatteringBase * mieDensity;
  float mieAbsorption = mieAbsorptionBase * mieDensity;

  vec3 ozoneAbsorption = ozoneAbsorptionBase * max(0.0, 1.0 - abs(altitudeKM - (25.0 * scalar)) / (15.0 * scalar));

  extinction = rayleighScattering + rayleighAbsorption + mieScattering + mieAbsorption + ozoneAbsorption;
}

void getMarsScatteringValues(
  vec3 pos,
  out vec3 CO2Scattering, // Scattering due to CO2
  out vec3 dustScattering, // Scattering due to Martian dust
  out vec3 extinction      // Total extinction including scattering and absorption
) {
  float altitudeKM = (length(pos) - groundRadiusMM) * 1000.0;

  float scalar = iAtmosphereSize * 0.01; 

  // Calculate CO2 scattering and absorption
  float CO2Density = getCO2Density(altitudeKM, scalar);
  CO2Scattering = CO2ScatteringBase * CO2Density;
  vec3 CO2Absorption = CO2AbsorptionBase * CO2Density; 

  // Calculate dust scattering and absorption
  float dustDensity = getDustDensity(altitudeKM, scalar);
  dustScattering = dustScatteringBase * dustDensity;
  vec3 dustAbsorption = DustAbsorptionBase * dustDensity;

  // Calculate total extinction
  extinction = CO2Scattering + CO2Absorption;// + dustScattering + dustAbsorption;
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