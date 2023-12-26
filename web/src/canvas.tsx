import { Loader } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
// @ts-ignore
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js'
import { PCFShadowMap } from 'three'

import { TerrainGlobe } from './terrain/globe'
import VolumeScene from './volume/scene'
import { SkyScene } from './sky/hillarie/scene'
// import { SkyScene } from './sky/scene'
import { Debug } from './debug'
import Controls from './controls'

export default function () {
  const onShaderError = (
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    vert: WebGLShader,
    frag: WebGLShader
  ) => {
    if (import.meta.hot) {
      const printErrorWithContext = (shader: WebGLShader, stack: string) => {
        let buffer = ""
        const errorLine = stack.match(/ERROR: \d+:(\d+)/)
        if (errorLine && errorLine.length > 1) {
          const lineNumber = parseInt(errorLine[1])
          const source = gl.getShaderSource(shader)
          if (!source) {
            return
          }
          const sourceLines = source.split('\n')
          buffer += stack.split('\n')[0] + '\n'
          buffer += sourceLines[lineNumber - 1].trim() + '\n'
        }
        console.error(buffer)
        import.meta.hot!.send('log:error', buffer)
      }

      let stack = gl.getShaderInfoLog(vert)
      if (stack) {
        printErrorWithContext(vert, stack)
      }

      stack = gl.getShaderInfoLog(frag)
      if (stack) {
        printErrorWithContext(frag, stack)
      }
    }
  }

  return (
    <>
      <Canvas
        shadows={{
          type: PCFShadowMap,
        }}
        camera={{ position: [2, 5, 15], far: 10000 }}
        gl={{
          debug: {
            checkShaderErrors: true,
            onShaderError,
          },
        }}
      >
        <Controls />

        <Debug />

        <SkyScene />

        {/* <VolumeScene /> */}

        {/* <TerrainGlobe /> */}

        {/* <TerrainDebug
          context={{
            aerialPerspective,
            irradiance,
            transmittance,
            sunDirection,
          }}
        /> */}
      </Canvas>
      <Loader />
    </>
  )
}
