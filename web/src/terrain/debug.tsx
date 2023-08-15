import { ScreenQuad } from '@react-three/drei'
import { SkyContext } from '../sky'
import { useUniforms } from '../shader/uniforms'
import { ShaderMaterial } from 'three'
import { useRef, useState } from 'react'
import debugFrag from './debug.frag'
import pass from '../shader/pass.vert'

export function TerrainDebug({ context }: { context: SkyContext }) {
  const material = useRef<ShaderMaterial>(null)
  const [fs, setFs] = useState(debugFrag)
  import.meta.hot?.accept('./debug.frag', (newModule) => {
    setFs(newModule!.default)
    material.current!.needsUpdate = true
  })
  useUniforms(material, (state) => {
    const w = state.size.width * state.viewport.dpr
    const h = state.size.height * state.viewport.dpr
    return {
      iResolution: { value: [w, h, 0] },
      iCameraWorld: { value: state.camera.matrixWorld },
      iCameraProjectionInverse: { value: state.camera.projectionMatrixInverse },
      iAerialPerspective: {
        value: context.aerialPerspective?.current,
      },
      iIrradiance: {
        value: context.irradiance?.current,
      },
      iSunDirection: {
        value: context.sunDirection?.current,
      },
      iTransmittance: {
        value: context.transmittance?.current,
      },
      iTime: {
        value: state.clock.elapsedTime,
      },
    }
  })

  return (
    <ScreenQuad>
      <shaderMaterial ref={material} fragmentShader={fs} vertexShader={pass} />
    </ScreenQuad>
  )
}
