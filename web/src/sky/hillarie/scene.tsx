import {
  Html,
  OrbitControls,
  ScreenQuad,
  useDepthBuffer,
} from '@react-three/drei'
import { UniformMaterial } from '../../shader/uniforms'
import vertexPass from '../../shader/pass.vert'
import textureFrag from './texture.frag'
import { useRenderTarget } from '../../shader/target'
import { RootState, useFrame, useThree } from '@react-three/fiber'
import { ShaderPass } from '../../shader/pass'
import transmittanceFrag from './transmittance.frag'
import scatteringFrag from './scattering.frag'
import skyFrag from './sky.frag'
import { useRef, useState } from 'react'
import {
  Data3DTexture,
  DoubleSide,
  IUniform,
  Scene,
  ShaderMaterial,
  Texture,
  Vector3,
  WebGLRenderTarget,
} from 'three'
import { SunHelper } from '../helper'
import Controls, { globalUniforms } from '../../controls'
import { TerrainDisplaced } from '../../terrain/displaced'
import { Terrain } from '../../terrain/tiled'
import { glsl } from '../../glsl'
import { sunDirection } from '..'

const TRANSMITTANCE_TEXTURE_WIDTH = 256
const TRANSMITTANCE_TEXTURE_HEIGHT = 64
const SCATTERING_TEXTURE_SIZE = 32

export const Sky = ({ sceneTarget }: { sceneTarget: WebGLRenderTarget }) => {
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

  const scenePostScalar = 1 / 1
  const skyPost = useRenderTarget({ scalar: scenePostScalar })

  const metaUniforms =
    (anyuniforms: Record<string, IUniform> = {}, scalar = 1) =>
    (state: RootState) => {
      const w = state.size.width * state.viewport.dpr
      const h = state.size.height * state.viewport.dpr

      // swap the render targets?
      // console.log(readTarget);
      const transmittanceValue =
        readTarget.current === 1
          ? transmittanceA.texture
          : transmittanceB.texture
      return {
        iSunDirection: { value: sunDirection },
        iTransmittance: { value: transmittanceValue },
        iMultiScattering: { value: scattering.texture },
        iScenePost: { value: skyPost.texture },
        iResolution: { value: [w * scalar, h * scalar, 0] },
        iCameraProjectionInverse: {
          value: state.camera.projectionMatrixInverse,
        },
        iCameraWorld: { value: state.camera.matrixWorld },
        iDepthBuffer: { value: sceneTarget.depthTexture },
        iSceneTexture: { value: sceneTarget.texture },
        MultiScatteringLUTRes: { value: SCATTERING_TEXTURE_SIZE },
        ...anyuniforms,
        ...globalUniforms,
      }
    }
  const matRef = useRef<ShaderMaterial>(null)
  const [fs, setFs] = useState(skyFrag)
  import('./sky.frag').then((m) => {
    setFs(m.default)
    if (!matRef.current) return
    matRef.current!.needsUpdate = true
  })
  return (
    <>
      <ShaderPass
        renderTarget={[transmittanceA, transmittanceB]}
        uniforms={metaUniforms()}
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
        renderTarget={skyPost}
        uniforms={metaUniforms({}, scenePostScalar)}
        fragmentShader={fs}
      />
      <ScreenQuad>
        <UniformMaterial
          depthTest={false}
          vertexShader={vertexPass}
          uniforms={metaUniforms()}
          fragmentShader={textureFrag}
          // fragmentShader={skyFrag}
        />
      </ScreenQuad>
    </>
  )
}

const DebugInfo = () => {
  const state = useThree()
  const getDebugInfo = (state: RootState) => {
    const a = state.camera.position
      .toArray()
      .map(
        // round to nearest 0.00
        (n) => Math.round(n * 100) / 100
      )

      .map((n) => n.toFixed(2).padStart(6, ' '))
      .join(', ')
    const b = state.camera.rotation
      .toArray()
      .map(
        // round to nearest 0.00
        (n) =>
          Math.round((parseFloat(n?.toString() || '0') / Math.PI) * 180 * 100) /
          100
      )
      .filter((n) => !isNaN(n))
      .map((n) => n.toFixed(2).padStart(6, ' '))
      .join(', ')
    return [a, b]
  }
  const [debugInfo, setDebugInfo] = useState(getDebugInfo(state))
  useFrame((state) => {
    const newInfo = getDebugInfo(state)
    if (debugInfo !== newInfo) {
      setDebugInfo(newInfo)
    }
  })
  return (
    <Html fullscreen style={{ pointerEvents: 'none', marginTop: 108 }}>
      <div
        style={{
          margin: 16,
          color: 'white',
          fontFamily: 'SF Mono',
          fontSize: 13,
          whiteSpace: 'pre',
        }}
      >
        <div>{`Camera Position -> [${debugInfo[0]}]`}</div>
        <div>{`Camera Rotation -> [${debugInfo[1]}]`}</div>
      </div>
    </Html>
  )
}

export const SkyScene = () => {
  const aerialPerspective = useRef<Data3DTexture>()
  const irradiance = useRef<Texture>()
  const transmittance = useRef<Texture>()
  const sunDir = useRef<Vector3>(sunDirection)
  const multiScattering = useRef<Texture>()
  const root = useRef<Scene>(null)
  const sceneTarget = useRenderTarget()

  useFrame((state) => {
    // render scene to scenePost
    const scene = root.current
    if (!scene) return
    scene.visible = true
    state.gl.setRenderTarget(sceneTarget)
    state.gl.clear()
    state.gl.render(scene, state.camera)
    state.gl.setRenderTarget(null)
    scene.visible = false
  })

  return (
    <>
      <DebugInfo />
      <Controls />
      <SunHelper direction={sunDirection} />
      <Sky sceneTarget={sceneTarget} />
      <scene ref={root} position={[0,0.1,0]}>
        <Terrain
          aerialPerspective={aerialPerspective}
          irradiance={irradiance}
          transmittance={transmittance}
          sunDirection={sunDir}
          multiScattering={multiScattering}
        />
      </scene>
    </>
  )
}
