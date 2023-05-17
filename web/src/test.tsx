import { ScreenQuad } from "@react-three/drei";
import { glsl } from "./shader/glsl";
import { UniformMaterial } from "./shader/uniforms";

export function Test() {
  return <ScreenQuad>
    <UniformMaterial
      uniforms={(state) => ({
        iTime: { value: state.clock.getElapsedTime() },
      })}
      fragmentShader={glsl`
      uniform float iTime;
      void main() {
        float t = sin(iTime) * 0.5 + 0.5;
        gl_FragColor = vec4(vec3(t), 1.0);
      }
    `}
    />
  </ScreenQuad>
}