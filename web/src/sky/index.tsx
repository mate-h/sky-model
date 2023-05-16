import { RootState, useFrame, useThree } from '@react-three/fiber'
import {
  HalfFloatType,
  RGBAFormat,
  WebGLRenderTarget,
  WebGL3DRenderTarget,
  LinearFilter,
  Vector3
} from 'three'
import transmittanceFragment from './transmittance.frag'
import scatteringFragment from './scattering.frag'
import skyviewFragment from './skyview.frag'
import aerialFragment from './aerial.frag'
import imageFragment from './image.frag'
import testFragment from './test.frag'
import { useMemo } from 'react'
import { ShaderPass } from '../shader/pass'
import vertexPass from '../shader/pass.vert'
import { ScreenQuad } from '@react-three/drei'
import { SunHelper } from './helper'

function useRenderTarget() {
  const opts = {
    type: HalfFloatType,
  }
  const { size, viewport } = useThree()
  return useMemo(() => {
    const w = size.width * viewport.dpr
    const h = size.height * viewport.dpr
    return new WebGLRenderTarget(w, h, opts)
  }, [size, viewport])
}

function use3DRenderTarget({
  width,
  height,
  depth,
}: {
  width: number
  height: number
  depth: number
}) {
  const opts = {
    type: HalfFloatType,
  }
  return useMemo(() => {
    const target = new WebGL3DRenderTarget(width, height, depth)
    target.texture.format = RGBAFormat
    target.texture.type = HalfFloatType
    target.texture.minFilter = LinearFilter
    target.texture.magFilter = LinearFilter
    return target
  }, [width, height, depth])
}

export function Sky() {
  const transmittanceTexture = useRenderTarget()
  const scatteringTexture = useRenderTarget()
  const skyviewTexture = useRenderTarget()
  const aerialPerspectiveTexture = use3DRenderTarget({
    width: 32,
    height: 32,
    depth: 32,
  })

  const sunDirection = useMemo(() => new Vector3(0, 0, -1), [])

  const getUniforms = (state: RootState) => {
    const w = state.size.width * state.viewport.dpr
    const h = state.size.height * state.viewport.dpr
    const t = state.clock.elapsedTime
    
    return {
      iResolution: { value: [w, h, 0] },
      iCameraWorld: { value: state.camera.matrixWorld },
      iCameraProjectionInverse: { value: state.camera.projectionMatrixInverse },
      iTransmittance: { value: transmittanceTexture?.texture },
      iScattering: { value: scatteringTexture?.texture },
      iSkyview: { value: skyviewTexture?.texture },
      iAerialPerspective: { value: aerialPerspectiveTexture?.texture },
      iTime: { value: t + 3 },
      iSunDirection: { value: sunDirection },
    }
  }
  const state = useThree()
  const uniforms = getUniforms(state)
  useFrame((state) => {
    Object.entries(getUniforms(state)).forEach(([key, uniform]) => {
      // @ts-ignore
      uniforms[key].value = uniform.value
    })
  })

  return (
    <>
      <ShaderPass
        fragmentShader={transmittanceFragment}
        uniforms={uniforms}
        renderTarget={transmittanceTexture}
      />

      <ShaderPass
        fragmentShader={scatteringFragment}
        uniforms={uniforms}
        renderTarget={scatteringTexture}
      />

      <ShaderPass
        fragmentShader={skyviewFragment}
        uniforms={uniforms}
        renderTarget={skyviewTexture}
      />

      <ShaderPass
        fragmentShader={aerialFragment}
        uniforms={uniforms}
        renderTarget={aerialPerspectiveTexture}
      />

       <ScreenQuad>
        <shaderMaterial
          depthTest={false}
          vertexShader={vertexPass}
          uniforms={uniforms}
          fragmentShader={imageFragment}
        />
      </ScreenQuad>

      {/* <ScreenQuad>
        <shaderMaterial
          depthTest={false}
          vertexShader={vertexPass}
          uniforms={uniforms}
          fragmentShader={testFragment}
        />
      </ScreenQuad> */}

      <SunHelper direction={sunDirection} />

      <gridHelper />
    </>
  )
}
