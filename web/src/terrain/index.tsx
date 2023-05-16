import mainFrag from "./main.frag"
import mainVert from "./main.vert"
export function Terrain() {

  const uniforms = {
    time: { value: 0 }
  }

  // dynamic LOD
  return <mesh rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[1, 1, 100, 100]} />
    <shaderMaterial
      vertexShader={mainVert}
      fragmentShader={mainFrag}
      uniforms={uniforms}
    />
  </mesh>
}