vec3 uvToRd(vec2 uv) {
  float phi = uv.x * 2. * PI + PI;
  float theta = (1. - uv.y) * PI;
  return vec3(sin(theta) * cos(phi), cos(theta), sin(theta) * sin(phi));
}

vec2 rdToUv(vec3 rd) {
  float phi = atan(rd.z, rd.x);
  float theta = acos(rd.y);
  float x = (phi + PI) / (2. * PI);
  float y = 1. - theta / PI;
  return vec2(x, y);
}

void cameraRay(out vec3 ro, out vec3 rd) {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord.xy / iResolution.xy;
  vec4 rayClip = vec4(uv * 2.0 - 1.0, -1.0, 1.0);
  vec4 rayEye = iCameraProjectionInverse * rayClip;
  rayEye = vec4(rayEye.xy, -1.0, 0.0);
  vec3 rayWorld = (iCameraWorld * rayEye).xyz;
  rayWorld = normalize(rayWorld);
  // three js built in uniform cameraPosition
  ro = getCameraPosition();
  rd = rayWorld;
}

void cameraRayUv(out vec3 ro, out vec3 rd, in vec2 uv) {
  vec4 rayClip = vec4(uv * 2.0 - 1.0, -1.0, 1.0);
  vec4 rayEye = iCameraProjectionInverse * rayClip;
  rayEye = vec4(rayEye.xy, -1.0, 0.0);
  vec3 rayWorld = (iCameraWorld * rayEye).xyz;
  rayWorld = normalize(rayWorld);
  // three js built in uniform cameraPosition
  ro = getCameraPosition();
  rd = rayWorld;
}