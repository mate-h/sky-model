import { OrbitControls, ScreenQuad, useTexture } from '@react-three/drei'
import { RootState, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { RepeatWrapping } from 'three'
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

  const scalar = 1 / 8
  const getUniforms = (state: RootState) => {
    const w = state.size.width * state.viewport.dpr * scalar
    const h = state.size.height * state.viewport.dpr * scalar
    return {
      resolution: { value: [w, h, 0] },
      cameraWorld: { value: state.camera.matrixWorld },
      cameraProjectionInverse: {
        value: state.camera.projectionMatrixInverse,
      },
      grayNoise: { value: grayNoise },
      time: { value: state.clock.getElapsedTime() },
    }
  }

  const renderTarget = useRenderTarget({ scalar })
  const { debug } = useControls({ debug: false })

  return (
    <>
      <OrbitControls target={[20, 18, -16]} />

      {debug && (
        <gridHelper args={[50, 50]} position={[20, 18, -16]}>
          <meshBasicMaterial
            attach="material"
            color={0xffffff}
            transparent
            opacity={0.12}
          />
        </gridHelper>
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
