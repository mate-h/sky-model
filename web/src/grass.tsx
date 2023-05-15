import { useTexture } from '@react-three/drei'

export function GrassMaterial() {
  const p = '/wffpcflbw_2K_t3'
  const s = (x: string) => `${p}${x}.jpg`
  const pbr = useTexture(s('pbr'))
  return (
    <meshStandardMaterial
      displacementMap={useTexture(s('displacement'))}
      displacementScale={0.1}
      roughnessMap={pbr}
      metalnessMap={pbr}
      normalMap={useTexture(s('normal'))}
      aoMap={pbr}
      map={useTexture(s('map'))}
    />
  )
}
