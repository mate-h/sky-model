import { RootState, useFrame, useThree } from '@react-three/fiber'
import {
  DirectionalLight,
  DirectionalLightHelper,
  HalfFloatType,
  IUniform,
  Scene,
  WebGLRenderTarget,
} from 'three'
import transmittanceFragment from './transmittance.frag'
import scatteringFragment from './scattering.frag'
import skyviewFragment from './skyview.frag'
import imageFragment from './image.frag'
import { useMemo, useRef } from 'react'
import { useHelper } from '@react-three/drei'

// glsl template literal
const glsl = (x: any) => x[0]

const vertexPass = glsl`
  out vec2 vUv;
  void main() { 
    vUv = uv;
    gl_Position = vec4(position, 1.0); 
  }
`

function ShaderPass({
  fragmentShader,
  renderTarget,
  uniforms,
}: {
  uniforms: Record<string, IUniform>
  fragmentShader: string
  renderTarget: WebGLRenderTarget
}) {
  const root = useRef<Scene>(null)
  useFrame(({ gl, camera }) => {
    const scene = root.current!
    if (!scene || !renderTarget) return
    scene.visible = true
    gl.setRenderTarget(renderTarget)
    gl.render(scene, camera)
    scene.visible = false
    gl.setRenderTarget(null)
  })
  return (
    <scene ref={root}>
      <mesh>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexPass}
          fragmentShader={fragmentShader}
          depthTest={false}
        />
      </mesh>
    </scene>
  )
}

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

export function Sky() {
  const transmittanceTexture = useRenderTarget()
  const scatteringTexture = useRenderTarget()
  const skyviewTexture = useRenderTarget()

  const getUniforms = (state: RootState) => {
    const w = state.size.width * state.viewport.dpr
    const h = state.size.height * state.viewport.dpr
    return {
      iResolution: { value: [w, h, 0] },
      iCameraWorld: { value: state.camera.matrixWorld },
      iCameraProjectionInverse: { value: state.camera.projectionMatrixInverse },
      iTransmittance: { value: transmittanceTexture?.texture },
      iScattering: { value: scatteringTexture?.texture },
      iSkyview: { value: skyviewTexture?.texture },
      iTime: { value: state.clock.elapsedTime },
    }
  }
  const state = useThree()
  const uniforms = getUniforms(state)
  useFrame((state) => {
    Object.entries(getUniforms(state)).forEach(([key, value]) => {
      // @ts-ignore
      uniforms[key].value = value.value
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

      <mesh>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          depthTest={false}
          vertexShader={vertexPass}
          uniforms={uniforms}
          fragmentShader={imageFragment}
        />
      </mesh>

      <gridHelper />
    </>
  )
}
