import { Loader, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Sky } from './sky'
import { Perf } from 'r3f-perf'
import { Terrain } from './terrain'
import { useRef } from 'react'
import { Data3DTexture, Texture, Vector3 } from 'three'

export default function () {
  // const space = 3
  // const itemCount = 3
  // const getX = (i: number) => (i - (itemCount - 1) / 2) * space

  const aerialPerspective = useRef<Data3DTexture>()
  const irradiance = useRef<Texture>()
  const transmittance = useRef<Texture>()
  const sunDirection = useRef<Vector3>()
  return (
    <>
      <Canvas camera={{ fov: 70, position: [0, 2, 8] }}>
        <Perf />
        {/* <fog attach="fog" /> */}
        <Sky
          aerialPerspective={aerialPerspective}
          irradiance={irradiance}
          transmittance={transmittance}
          sunDirection={sunDirection}
        />
        <Terrain aerialPerspective={aerialPerspective}
          irradiance={irradiance}
          transmittance={transmittance}
          sunDirection={sunDirection} />

        {/* <Test /> */}

        <gridHelper />
        <axesHelper />

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
      <Loader />
    </>
  )
}
