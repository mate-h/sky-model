

#define DEBUGENABLED 0
#define ToDebugWorld vec3(0, 0, -ptc.Atmosphere.BottomRadius)

#define RAYDPOS 0.00001f

#ifndef GROUND_GI_ENABLED
#define GROUND_GI_ENABLED 0
#endif
#ifndef TRANSMITANCE_METHOD
#define TRANSMITANCE_METHOD 2
#endif
#ifndef MULTISCATAPPROX_ENABLED 
#define MULTISCATAPPROX_ENABLED 0 
#endif
#ifndef GAMEMODE_ENABLED 
#define GAMEMODE_ENABLED 0 
#endif
#ifndef COLORED_TRANSMITTANCE_ENABLED 
#define COLORED_TRANSMITTANCE_ENABLED 0 
#endif
#ifndef FASTSKY_ENABLED 
#define FASTSKY_ENABLED 0 
#endif
#ifndef FASTAERIALPERSPECTIVE_ENABLED 
#define FASTAERIALPERSPECTIVE_ENABLED 0 
#endif
#ifndef SHADOWMAP_ENABLED 
#define SHADOWMAP_ENABLED 0 
#endif
#ifndef MEAN_ILLUM_MODE 
#define MEAN_ILLUM_MODE 0 
#endif

#define RENDER_SUN_DISK 1

#if 1
#define USE_CornetteShanks
#define MIE_PHASE_IMPORTANCE_SAMPLING 0
#else
// Beware: untested, probably faulty code path.
// Mie importance sampling is only used for multiple scattering. Single scattering is fine and noise only due to sample selection on view ray.
// A bit more expenssive so off for now.
#define MIE_PHASE_IMPORTANCE_SAMPLING 1
#endif

#define PLANET_RADIUS_OFFSET 0.01f

#define PI 3.1415926535897932384626433832795f
#define ILLUMINANCE_IS_ONE
// #define saturate(x) clamp(x, 0.0, 1.0)

const int TRANSMITTANCE_TEXTURE_WIDTH = 256;
const int TRANSMITTANCE_TEXTURE_HEIGHT = 64;

uniform vec3 iResolution;
uniform mat4 iCameraProjectionInverse;
uniform mat4 iCameraWorld;
uniform sampler2D iTransmittance;
uniform vec3 iSunIlluminance;
uniform vec3 iSunDirection;
uniform float MultiScatteringLUTRes;
uniform float iValue;
uniform sampler2D iDepthBuffer;
const vec3 SunLuminance = vec3(1000000.0); // arbitrary. But fine, not use when comparing the models
uniform sampler2D iSceneTexture;

struct AtmosphereParameters {
	// Radius of the planet (center to ground)
	float BottomRadius;
	// Maximum considered atmosphere height (center to atmosphere top)
	float TopRadius;

	// Rayleigh scattering exponential distribution scale in the atmosphere
	float RayleighDensityExpScale;
	// Rayleigh scattering coefficients
	vec3 RayleighScattering;

	// Mie scattering exponential distribution scale in the atmosphere
	float MieDensityExpScale;
	// Mie scattering coefficients
	vec3 MieScattering;
	// Mie extinction coefficients
	vec3 MieExtinction;
	// Mie absorption coefficients
	vec3 MieAbsorption;
	// Mie phase function excentricity
	float MiePhaseG;

	// Another medium type in the atmosphere
	float AbsorptionDensity0LayerWidth;
	float AbsorptionDensity0ConstantTerm;
	float AbsorptionDensity0LinearTerm;
	float AbsorptionDensity1ConstantTerm;
	float AbsorptionDensity1LinearTerm;
	// This other medium only absorb light, e.g. useful to represent ozone in the earth atmosphere
	vec3 AbsorptionExtinction;

	// The albedo of the ground.
	vec3 GroundAlbedo;
};

struct MediumSampleRGB {
	vec3 scattering;
	vec3 absorption;
	vec3 extinction;

	vec3 scatteringMie;
	vec3 absorptionMie;
	vec3 extinctionMie;

	vec3 scatteringRay;
	vec3 absorptionRay;
	vec3 extinctionRay;

	vec3 scatteringOzo;
	vec3 absorptionOzo;
	vec3 extinctionOzo;

	vec3 albedo;
};

// - r0: ray origin
// - rd: normalized ray direction
// - s0: sphere center
// - sR: sphere radius
// - Returns distance from r0 to first intersecion with sphere,
//   or -1.0 if no intersection.
float raySphereIntersectNearest(vec3 r0, vec3 rd, vec3 s0, float sR) {
	float a = dot(rd, rd);
	vec3 s0_r0 = r0 - s0;
	float b = 2.0 * dot(rd, s0_r0);
	float c = dot(s0_r0, s0_r0) - (sR * sR);
	float delta = b * b - 4.0 * a * c;
	if(delta < 0.0 || a == 0.0) {
		return -1.0;
	}
	float sol0 = (-b - sqrt(delta)) / (2.0 * a);
	float sol1 = (-b + sqrt(delta)) / (2.0 * a);
	if(sol0 < 0.0 && sol1 < 0.0) {
		return -1.0;
	}
	if(sol0 < 0.0) {
		return max(0.0, sol1);
	} else if(sol1 < 0.0) {
		return max(0.0, sol0);
	}
	return max(0.0, min(sol0, sol1));
}

vec3 getAlbedo(vec3 scattering, vec3 extinction) {
	return vec3(scattering.x / max(0.001, extinction.x), scattering.y / max(0.001, extinction.y), scattering.z / max(0.001, extinction.z));
}

float CornetteShanksMiePhaseFunction(float g, float cosTheta) {
	float k = 3.0 / (8.0 * PI) * (1.0 - g * g) / (2.0 + g * g);
	return k * (1.0 + cosTheta * cosTheta) / pow(1.0 + g * g - 2.0 * g * -cosTheta, 1.5);
}

float RayleighPhase(float cosTheta) {
	float factor = 3.0 / (16.0 * PI);
	return factor * (1.0 + cosTheta * cosTheta);
}

float hgPhase(float g, float cosTheta) {
#ifdef USE_CornetteShanks
	return CornetteShanksMiePhaseFunction(g, cosTheta);
#else
	// Reference implementation (i.e. not schlick approximation). 
	// See http://www.pbr-book.org/3ed-2018/Volume_Scattering/Phase_Functions.html
	float numer = 1.0 - g * g;
	float denom = 1.0 + g * g + 2.0 * g * cosTheta;
	return numer / (4.0 * PI * denom * sqrt(denom));
#endif
}

void LutTransmittanceParamsToUv(AtmosphereParameters Atmosphere, in float viewHeight, in float viewZenithCosAngle, out vec2 uv) {
	float H = sqrt(max(0.0, Atmosphere.TopRadius * Atmosphere.TopRadius - Atmosphere.BottomRadius * Atmosphere.BottomRadius));
	float rho = sqrt(max(0.0, viewHeight * viewHeight - Atmosphere.BottomRadius * Atmosphere.BottomRadius));

	float discriminant = viewHeight * viewHeight * (viewZenithCosAngle * viewZenithCosAngle - 1.0) + Atmosphere.TopRadius * Atmosphere.TopRadius;
	float d = max(0.0, (-viewHeight * viewZenithCosAngle + sqrt(discriminant))); // Distance to atmosphere boundary

	float d_min = Atmosphere.TopRadius - viewHeight;
	float d_max = rho + H;
	float x_mu = (d - d_min) / (d_max - d_min);
	float x_r = rho / H;

	uv = vec2(x_mu, x_r);
	//uv = vec2(fromUnitToSubUvs(uv.x, TRANSMITTANCE_TEXTURE_WIDTH), fromUnitToSubUvs(uv.y, TRANSMITTANCE_TEXTURE_HEIGHT)); // No real impact so off
}

float fromUnitToSubUvs(float u, float resolution) {
	return (u + 0.5 / resolution) * (resolution / (resolution + 1.0));
}
float fromSubUvsToUnit(float u, float resolution) {
	return (u - 0.5 / resolution) * (resolution / (resolution - 1.0));
}

vec3 GetSunLuminance(vec3 WorldPos, vec3 WorldDir, float PlanetRadius) {
	vec3 sun_direction = normalize(iSunDirection);
#if RENDER_SUN_DISK
	if(dot(WorldDir, sun_direction) > cos(0.5 * 0.505 * 3.14159 / 180.0)) {
		float t = raySphereIntersectNearest(WorldPos, WorldDir, vec3(0.0, 0.0, 0.0), PlanetRadius);
		if(t < 0.0) // no intersection
		{
			const vec3 SunLuminance = vec3(1000000.0); // arbitrary. But fine, not use when comparing the models
			// const vec3 SolarIrradiance = vec3(1.474000, 1.850400, 1.911980);
			return SunLuminance;
		}
	}
#endif
	return vec3(0.0);
}

bool MoveToTopAtmosphere(inout vec3 WorldPos, in vec3 WorldDir, in float AtmosphereTopRadius) {
	float viewHeight = length(WorldPos);
	if(viewHeight > AtmosphereTopRadius) {
		float tTop = raySphereIntersectNearest(WorldPos, WorldDir, vec3(0.0, 0.0, 0.0), AtmosphereTopRadius);
		if(tTop >= 0.0) {
			vec3 UpVector = WorldPos / viewHeight;
			vec3 UpOffset = UpVector * -PLANET_RADIUS_OFFSET;
			WorldPos = WorldPos + WorldDir * tTop + UpOffset;
		} else {
			// Ray is not intersecting the atmosphere
			return false;
		}
	}
	return true; // ok to start tracing
}

vec3 GetTransmittanceToSun(AtmosphereParameters Atmosphere, vec3 P) {
	float pHeight = length(P);
	vec3 UpVector = P / pHeight;
	float SunZenithCosAngle = dot(iSunDirection, UpVector);
	vec2 uv;
	LutTransmittanceParamsToUv(Atmosphere, pHeight, SunZenithCosAngle, uv);
	vec3 TransmittanceToSun = texture(iTransmittance, uv).rgb;
	return TransmittanceToSun;
}