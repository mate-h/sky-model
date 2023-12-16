import { GrassMaterial } from './grass'

export function Geometry() {
  const space = 3
  const itemCount = 3
  const getX = (i: number) => (i - (itemCount - 1) / 2) * space
  return (
    <>
      <mesh position={[getX(0), 0, 0]}>
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
      </mesh>
    </>
  )
}
