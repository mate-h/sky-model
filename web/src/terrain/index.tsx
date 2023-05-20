import { ShaderMaterial } from 'three'
import mainFrag from './main.frag'
import mainVert from './main.vert'
import { useRef } from 'react'
import { useUniforms } from '../shader/uniforms'
import { SkyContext } from '../sky'

export function Terrain({
  aerialPerspective,
  transmittance,
  irradiance,
  sunDirection,
}: SkyContext) {
  const matRef = useRef<ShaderMaterial>(null)
  useUniforms(matRef, (state) => {
    const w = state.size.width * state.viewport.dpr
    const h = state.size.height * state.viewport.dpr
    return {
      iResolution: { value: [w, h, 0] },
      iCameraWorld: { value: state.camera.matrixWorld },
      iCameraProjectionInverse: { value: state.camera.projectionMatrixInverse },
      iAerialPerspective: {
        value: aerialPerspective?.current,
      },
      iIrradiance: {
        value: irradiance?.current,
      },
      iSunDirection: {
        value: sunDirection?.current,
      },
      iTransmittance: {
        value: transmittance?.current,
      },
      iTime: {
        value: state.clock.elapsedTime,
      },
      iExposure: { value: 20 },
    }
  })

  // dynamic LOD
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10, 160, 160]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={mainVert}
        fragmentShader={mainFrag}
      />
    </mesh>
  )
}
