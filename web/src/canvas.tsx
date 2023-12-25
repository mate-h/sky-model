import { Loader } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
// @ts-ignore
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js'
import { PCFShadowMap } from 'three'

import { TerrainGlobe } from './terrain/globe'
import VolumeScene from './volume/scene'
import { SkyScene } from './sky/scene'
import { Debug } from './debug'
import Controls from './controls'

export default function () {
  return (
    <>
      <Canvas
        shadows={{
          type: PCFShadowMap,
        }}
        camera={{ position: [2, 5, 15], far: 10000 }}
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
