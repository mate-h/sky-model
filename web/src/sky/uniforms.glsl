precision highp sampler3D;

uniform mat4 iCameraWorld;
uniform mat4 iCameraProjectionInverse;
uniform vec3 iResolution;
uniform sampler2D iTransmittance;
uniform sampler2D iMultiScattering;
uniform sampler2D iSkyview;
uniform sampler2D iIrradiance;
uniform sampler3D iAerialPerspective;
uniform float iTime;
uniform float iDepth;
uniform vec3 iSunDirection;
uniform float iExposure;
uniform float iAtmosphereSize;