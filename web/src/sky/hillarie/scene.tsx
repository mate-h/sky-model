import { OrbitControls, ScreenQuad, useDepthBuffer } from '@react-three/drei'
import { UniformMaterial } from '../../shader/uniforms'
import vertexPass from '../../shader/pass.vert'
import textureFrag from './texture.frag'
import { useRenderTarget } from '../../shader/target'
import { RootState, useFrame } from '@react-three/fiber'
import { ShaderPass } from '../../shader/pass'
import transmittanceFrag from './transmittance.frag'
import scatteringFrag from './scattering.frag'
import skyFrag from './sky.frag'
import { useRef, useState } from 'react'
import {
  Data3DTexture,
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
import { Terrain } from '../../terrain/shaded'
import { glsl } from '../../glsl'

const TRANSMITTANCE_TEXTURE_WIDTH = 256
const TRANSMITTANCE_TEXTURE_HEIGHT = 64
const SCATTERING_TEXTURE_SIZE = 32

export const sunDirection = new Vector3(0, 0.2, -1).normalize()

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
        iDepthBuffer: { value: sceneTarget.texture },
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
    state.gl.setClearColor(0xffffff, 0)
    state.gl.clear()
    state.gl.render(scene, state.camera)
    state.gl.setRenderTarget(null)
    scene.visible = false
  })

  const geoSize = 1
  return (
    <>
      <Controls />
      <SunHelper direction={sunDirection} />
      <OrbitControls makeDefault />
      <Sky sceneTarget={sceneTarget} />
      <scene ref={root}>
        {/* <mesh>
          <boxGeometry args={[geoSize, geoSize, geoSize]} />
          <meshBasicMaterial />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10 * geoSize, 10 * geoSize]} />
          <meshBasicMaterial />
        </mesh> */}

        <Terrain
          aerialPerspective={aerialPerspective}
          irradiance={irradiance}
          transmittance={transmittance}
          sunDirection={sunDir}
          multiScattering={multiScattering}
        />
      </scene>

      {/* <mesh>
        <boxGeometry args={[geoSize, geoSize, geoSize]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10 * geoSize, 10 * geoSize]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh> */}
      {/* <Terrain
        aerialPerspective={aerialPerspective}
        irradiance={irradiance}
        transmittance={transmittance}
        sunDirection={sunDir}
        multiScattering={multiScattering}
      /> */}
    </>
  )
}
