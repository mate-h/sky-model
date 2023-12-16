
uniform vec3 resolution;
uniform sampler2D starMap;
uniform float offset;
uniform mat4 cameraProjectionInverse;
uniform mat4 cameraWorld;
uniform sampler2D grayNoise;
uniform float time;

struct Ray {
  vec3 origin;
  vec3 direction;
};

Ray cameraRay(vec2 fragCoord) {
  vec2 uv = fragCoord.xy / resolution.xy;
  vec4 rayClip = vec4(uv * 2.0 - 1.0, -1.0, 1.0);
  vec4 rayEye = cameraProjectionInverse * rayClip;
  rayEye = vec4(rayEye.xy, -1.0, 0.0);
  vec3 rayWorld = (cameraWorld * rayEye).xyz;
  rayWorld = normalize(rayWorld);
  return Ray(cameraPosition, rayWorld);
}

const float PI = 3.14159265358;
const float REPEAT = 16.;

#include ../volume/shader.frag

float checker(vec3 rd) {
  vec2 uv = vec2(0.);
  uv.x = atan(rd.x, rd.z) / (2. * PI) + 0.5;
  uv.y = asin(rd.y) / PI + .5;
  float cx = floor(REPEAT * uv.x);
  float cy = floor(REPEAT * uv.y); 
  float result = mod(cx + cy, 2.0);
  return sign(result);
}

float flare(vec2 U) {
  vec2 A = sin(vec2(0, 1.57));
  U = abs(U * mat2(A, -A.y, A.x)) * mat2(2, 0, 1, 1.7);
  return .2 / max(U.x, U.y);
}

float sphere(vec3 rd) {
  vec3 o = fract(rd * 10.);
  float d = length(rd + o);
  float r = 0.7;
  float aa = smoothstep(r - fwidth(d), r, d);
  return 1. - aa;
}

void mainShader(out vec4 fragColor, in vec2 fragCoord) {
  
  Ray ray = cameraRay(fragCoord);

  vec3 rd = ray.direction;

  fragColor.rgb = vec3(checker(rd) * .1);
  fragColor.a = 1.;

  mainImage(fragColor, ray);
  // vec3 c = render(ray.origin, ray.direction);
  // fragColor.rgb = c;
  // fragColor.a = 1.;
}

void main() {
  mainShader(gl_FragColor, gl_FragCoord.xy);

  // #include <tonemapping_fragment>
}