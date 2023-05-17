#include ../sky/uniforms
#include ../sky/common
#include ../sky/ray
#include fbm
#include common

in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

void main() {
  vec3 color;

  vec3 lutRes = vec3(32.);
  vec3 ro, rd;
  cameraRay(ro, rd, lutRes);

  vec3 pos = transformPosition(vPosition);

  // Calculate the distance from the camera to the current fragment position
  float dist = length(pos - ro);

  // Clamp the distance to the maximum distance that the LUT represents
  float t = clamp(dist / 0.032, 0.0, 1.0); // 0.032 units are 32 kilometers

  // Calculate screen space UV coordinates from the fragment's position
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  vec3 uvw;
  uvw.xy = uv;
  uvw.z = t;

  // inscatter and transmittance at the current position
  vec4 col = texture(iAerialPerspective, uvw);

  vec4 fragColor;
  fragColor.rgb = col.rgb * iExposure * col.a;
  fragColor.a = 1.0;

  gl_FragColor = fragColor;

  // gl_FragColor = texture(iTransmittance, vUv);

  #include <tonemapping_fragment>
}