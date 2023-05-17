import { Data3DTexture, ShaderMaterial } from 'three'
import mainFrag from './main.frag'
import mainVert from './main.vert'
import { useRef } from 'react'
import { useUniforms } from '../shader/uniforms'

export function Terrain({
  aerialPerspective,
}: {
  aerialPerspective?: React.MutableRefObject<Data3DTexture | undefined>
}) {
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
      iTime: {
        value: state.clock.elapsedTime,
      },
      iExposure: { value: 20 },
    }
  })

  // dynamic LOD
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8, 8, 160, 160]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={mainVert}
        fragmentShader={mainFrag}
      />
    </mesh>
  )
}
