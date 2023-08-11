import { Loader, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sky } from './sky'
import { Perf } from 'r3f-perf'
import { Terrain } from './terrain/shaded'
import { useRef } from 'react'
import { Data3DTexture, LineBasicMaterial, PCFShadowMap, Texture, Vector3, WebGLShadowMap } from 'three'
import { TerrainDisplaced } from './terrain/displaced'
import { TerrainDebug } from './terrain/debug'
import { useAtom } from 'jotai'
import { debugAtom } from './controls'

function Debug() {
  const [debug] = useAtom(debugAtom)
  if (!debug) return null
  return (
    <>
      <Perf position="top-left" />
      <gridHelper
        position={[0, 3, 0]}
        args={[1000, 100, 0xffffff, 0xffffff]}
      />
      <axesHelper args={[10]} position={[0, 3.01, 0]}/>
    </>
  )
}

export default function () {
  // const space = 3
  // const itemCount = 3
  // const getX = (i: number) => (i - (itemCount - 1) / 2) * space

  const aerialPerspective = useRef<Data3DTexture>()
  const irradiance = useRef<Texture>()
  const transmittance = useRef<Texture>()
  const sunDirection = useRef<Vector3>()
  const multiScattering = useRef<Texture>()
  return (
    <>
      <Canvas shadows={{
        type: PCFShadowMap,
        
        }} camera={{ position: [2, 5, 15] }}>
        <Debug />
        {/* <fog attach="fog" /> */}
        <Sky
          aerialPerspective={aerialPerspective}
          irradiance={irradiance}
          transmittance={transmittance}
          sunDirection={sunDirection}
          multiScattering={multiScattering}
        />

        <Terrain
          aerialPerspective={aerialPerspective}
          irradiance={irradiance}
          transmittance={transmittance}
          sunDirection={sunDirection}
          multiScattering={multiScattering}
        />

        {/* <TerrainDebug
          context={{
            aerialPerspective,
            irradiance,
            transmittance,
            sunDirection,
          }}
        /> */}

        {/* <Test /> */}

        {/* <mesh position={[getX(0), 0, 0]}>
          <sphereGeometry />
          <meshStandardMaterial />
        </mesh>

        <mesh position={[getX(1), 0, 0]}>
          <sphereGeometry />
          <meshStandardMaterial metalness={1} roughness={0} />
        </mesh>

        <mesh position={[getX(2), 0, 0]}>
          <sphereGeometry />
          <GrassMaterial />
        </mesh> */}

        <OrbitControls makeDefault />
      </Canvas>
      {/* <Loader /> */}
    </>
  )
}
