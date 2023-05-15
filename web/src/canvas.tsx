import { Loader, OrbitControls, Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Sky } from './sky'
import { GrassMaterial } from './grass'
import { Perf } from 'r3f-perf'

export default function () {
  const space = 3
  const itemCount = 3
  const getX = (i: number) => (i - (itemCount - 1) / 2) * space
  return (
    <>
      <Canvas camera={{ fov: 70 }}>
        <Perf />
        {/* <fog attach="fog" /> */}
        <Sky />

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

        <OrbitControls />
      </Canvas>
      <Loader />
    </>
  )
}
