import {
  OrbitControls,
  ScreenQuad,
  TransformControls,
  useTexture,
} from '@react-three/drei'
import { RootState, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { RepeatWrapping, Vector3 } from 'three'
import frag from './main.frag'
import vert from './shader.vert'
import textureFrag from './texture.frag'
import { UniformMaterial } from '../shader/uniforms'
import { ShaderPass } from '../shader/pass'
import { useRenderTarget } from '../shader/target'
import { useControls } from 'leva'

export default function VolumeScene() {
  const grayNoise = useTexture('gray-noise.png')
  grayNoise.wrapS = grayNoise.wrapT = RepeatWrapping

  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(20.0, 40.0, -90.0)
  }, [camera])

  const mesh = useRef<THREE.Mesh>(null)
  const position = useMemo(() => new Vector3(30, 18, -16), [])
  const scalar = 1 / 8
  const getUniforms = (state: RootState) => {
    const w = state.size.width * state.viewport.dpr * scalar
    const h = state.size.height * state.viewport.dpr * scalar
    if (mesh.current?.parent?.position) {
      position.copy(mesh.current!.parent!.position)
    }
    return {
      resolution: { value: [w, h, 0] },
      cameraWorld: { value: state.camera.matrixWorld },
      cameraProjectionInverse: {
        value: state.camera.projectionMatrixInverse,
      },
      grayNoise: { value: grayNoise },
      time: { value: state.clock.getElapsedTime() },
      translate: { value: position },
    }
  }

  const renderTarget = useRenderTarget({ scalar })
  const { debug } = useControls({ debug: false })

  return (
    <>
      <OrbitControls makeDefault target={[20, 18, -16]} />

      {/* <gridHelper visible={debug} args={[50, 50]} position={[20, 18, -16]}>
        <meshBasicMaterial
          attach="material"
          color={0xffffff}
          transparent
          opacity={0.12}
        />
      </gridHelper> */}

      {debug && (
        <TransformControls position={position}>
          <mesh ref={mesh} />
        </TransformControls>
      )}

      <ShaderPass
        renderTarget={renderTarget}
        uniforms={getUniforms}
        fragmentShader={frag}
      />

      <ScreenQuad>
        <UniformMaterial
          vertexShader={vert}
          fragmentShader={textureFrag}
          uniforms={() => ({
            volume: { value: renderTarget.texture },
          })}
          depthWrite={false}
          depthTest={false}
        />
      </ScreenQuad>
    </>
  )
}
