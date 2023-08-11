import { RootState, useThree } from '@react-three/fiber'
import {
  HalfFloatType,
  RGBAFormat,
  WebGLRenderTarget,
  WebGL3DRenderTarget,
  LinearFilter,
  Vector3,
  Data3DTexture,
  ClampToEdgeWrapping,
  Texture,
  ShaderMaterial,
} from 'three'
import transmittanceFragment from './transmittance.frag'
import scatteringFragment from './scattering.frag'
import skyviewFragment from './skyview.frag'
import irradianceFragment from './irradiance.frag'
import aerialFragment from './aerial.frag'
import imageFragment from './image.frag'
import testFragment from './test.frag'
import { useMemo, useRef, useState } from 'react'
import { ShaderPass } from '../shader/pass'
import vertexPass from '../shader/pass.vert'
import { ScreenQuad } from '@react-three/drei'
import { SunHelper } from './helper'
import { UniformMaterial } from '../shader/uniforms'
import { globalUniforms } from '../controls'
import { use3DRenderTarget, useRenderTarget } from '../shader/target'

export const sunDirection = new Vector3(0, .2, -1).normalize();

export type SkyContext = {
  sunDirection?: React.MutableRefObject<Vector3 | undefined>
  aerialPerspective?: React.MutableRefObject<Data3DTexture | undefined>
  transmittance?: React.MutableRefObject<Texture | undefined>
  irradiance?: React.MutableRefObject<Texture | undefined>
  multiScattering?: React.MutableRefObject<Texture | undefined>
}

export function Sky({
  aerialPerspective,
  transmittance,
  irradiance,
  sunDirection: sunDir,
  multiScattering,
}: SkyContext) {
  const transmittanceTexture = useRenderTarget()
  const multiScatteringTexture = useRenderTarget()
  const skyviewTexture = useRenderTarget()
  const irradianceTexture = useRenderTarget()
  const aerialPerspectiveTexture = use3DRenderTarget({
    width: 32,
    height: 32,
    depth: 32,
  })

  const getUniforms = (state: RootState) => {
    const w = state.size.width * state.viewport.dpr
    const h = state.size.height * state.viewport.dpr
    const t = state.clock.elapsedTime

    if (aerialPerspective) {
      aerialPerspective.current = aerialPerspectiveTexture.texture
    }
    if (irradiance) {
      irradiance.current = irradianceTexture.texture
    }
    if (sunDir) {
      sunDir.current = sunDirection
    }
    if (transmittance) {
      transmittance.current = transmittanceTexture.texture
    }
    if (multiScattering) {
      multiScattering.current = multiScatteringTexture.texture
    }

    return {
      iResolution: { value: [w, h, 0] },
      iCameraWorld: { value: state.camera.matrixWorld },
      iCameraProjectionInverse: { value: state.camera.projectionMatrixInverse },
      iTransmittance: { value: transmittanceTexture?.texture },
      iMultiScattering: { value: multiScatteringTexture?.texture },
      iIrradiance: { value: irradianceTexture?.texture },
      iSkyview: { value: skyviewTexture?.texture },
      iAerialPerspective: { value: aerialPerspectiveTexture?.texture },
      iTime: { value: t + 3 },
      iSunDirection: { value: sunDirection },
      ...globalUniforms,
    }
  }

  let testing = false

  const matRef = useRef<ShaderMaterial>(null)
  const [fs, setFs] = useState(imageFragment)
  import('./image.frag').then((m) => {
    setFs(m.default)
    matRef.current!.needsUpdate = true
  })

  return (
    <>
      <ShaderPass
        fragmentShader={transmittanceFragment}
        uniforms={getUniforms}
        renderTarget={transmittanceTexture}
      />

      <ShaderPass
        fragmentShader={scatteringFragment}
        uniforms={getUniforms}
        renderTarget={multiScatteringTexture}
      />

      <ShaderPass
        fragmentShader={skyviewFragment}
        uniforms={getUniforms}
        renderTarget={skyviewTexture}
      />

      <ShaderPass
        fragmentShader={irradianceFragment}
        uniforms={getUniforms}
        renderTarget={irradianceTexture}
      />

      <ShaderPass
        fragmentShader={aerialFragment}
        uniforms={getUniforms}
        renderTarget={aerialPerspectiveTexture}
      />


      {testing && <ScreenQuad>
        <UniformMaterial
          depthTest={false}
          vertexShader={vertexPass}
          uniforms={getUniforms}
          fragmentShader={testFragment}
        />
      </ScreenQuad>}

      {!testing && <ScreenQuad>
        <UniformMaterial
          ref={matRef}
          depthTest={false}
          vertexShader={vertexPass}
          uniforms={getUniforms}
          fragmentShader={fs}
        />
      </ScreenQuad>}

      <SunHelper direction={sunDirection} />
    </>
  )
}
