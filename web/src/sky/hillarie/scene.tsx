import { OrbitControls, ScreenQuad } from '@react-three/drei'
import { UniformMaterial } from '../../shader/uniforms'
import vertexPass from '../../shader/pass.vert'
import textureFrag from './texture.frag'
import { useRenderTarget } from '../../shader/target'
import { RootState } from '@react-three/fiber'
import { ShaderPass } from '../../shader/pass'
import transmittanceFrag from './transmittance.frag'
import scatteringFrag from './scattering.frag'
import skyFrag from './sky.frag'
import { useRef, useState } from 'react'
import { ShaderMaterial, Vector3 } from 'three'
import { SunHelper } from '../helper'
import Controls, { globalUniforms } from '../../controls'

const TRANSMITTANCE_TEXTURE_WIDTH = 256
const TRANSMITTANCE_TEXTURE_HEIGHT = 64
const SCATTERING_TEXTURE_SIZE = 32

export const SkyScene = () => {
  const readTarget = useRef(0)
  const transmittanceA = useRenderTarget({
    width: TRANSMITTANCE_TEXTURE_WIDTH,
    height: TRANSMITTANCE_TEXTURE_HEIGHT,
  })
  const transmittanceB = useRenderTarget({
    width: TRANSMITTANCE_TEXTURE_WIDTH,
    height: TRANSMITTANCE_TEXTURE_HEIGHT,
  })
  const scattering = useRenderTarget({
    width: SCATTERING_TEXTURE_SIZE,
    height: SCATTERING_TEXTURE_SIZE,
  })

  const scenePost = useRenderTarget()
  const sunDirection = useRef<THREE.Vector3>(new Vector3(0, 0, -1))
  function getUniforms(state: RootState) {
    const w = state.size.width * state.viewport.dpr
    const h = state.size.height * state.viewport.dpr
    
    // swap the render targets?
    // console.log(readTarget);
    const transmittanceValue = readTarget.current === 1 ? transmittanceA.texture : transmittanceB.texture
    return {
      iSunDirection: { value: sunDirection.current },
      iTransmittance: { value: transmittanceValue },
      iMultiScattering: { value: scattering.texture },
      iScenePost: { value: scenePost.texture },
      iResolution: { value: [w, h, 0] },
      iCameraProjectionInverse: { value: state.camera.projectionMatrixInverse },
      iCameraWorld: { value: state.camera.matrixWorld },
      MultiScatteringLUTRes: { value: SCATTERING_TEXTURE_SIZE },
      ...globalUniforms
    }
  }
  const matRef = useRef<ShaderMaterial>(null)
  const [fs, setFs] = useState(skyFrag)
  import('./sky.frag').then((m) => {
    setFs(m.default)
    if (!matRef.current) return;
    matRef.current!.needsUpdate = true
  })
  return (
    <>
      <Controls />
      <ShaderPass
        renderTarget={[transmittanceA, transmittanceB]}
        uniforms={getUniforms}
        fragmentShader={transmittanceFrag}
        readTarget={readTarget}
      />
      {/* <ShaderPass
        matRef={matRef}
        renderTarget={scattering}
        uniforms={getUniforms}
        fragmentShader={fs}
      /> */}

      <ShaderPass
      matRef={matRef}
        renderTarget={scenePost}
        uniforms={getUniforms}
        fragmentShader={fs}
      />
      <ScreenQuad>
        <UniformMaterial
          depthTest={false}
          vertexShader={vertexPass}
          uniforms={getUniforms}
          fragmentShader={textureFrag}
          // fragmentShader={skyFrag}
        />
      </ScreenQuad>

      <SunHelper direction={sunDirection.current} />

      <OrbitControls makeDefault />
    </>
  )
}
