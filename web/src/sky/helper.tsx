import { TransformControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { Quaternion, Vector3 } from 'three'

const q = new Quaternion()
const startDirection = new Vector3(0, 0, -1)
const directionTarget = new Vector3()

type Props = {
  children?: React.ReactNode
  enabled?: boolean
  direction?: Vector3
  damping?: number
}

export function SunHelper({
  children,
  enabled = true,
  direction,
  damping = 0.05,
}: Props) {
  const controlsRef = useRef<any>()
  useLayoutEffect(() => {
    // set default direction to direction prop
    controlsRef.current!.object.quaternion.setFromUnitVectors(
      new Vector3(0, 0, -1),
      direction
    )
  }, [])
  useFrame(() => {
    if (!controlsRef.current) return
    const o = controlsRef.current.object as THREE.Object3D
    if (o) {
      o.getWorldQuaternion(q)
      directionTarget.copy(startDirection).applyQuaternion(q)
      if (direction) {
        direction.lerp(directionTarget, damping).normalize();
      }
    }
  })
  if (!enabled) return <>{children}</>
  return (
    <>
      <TransformControls ref={controlsRef} mode="rotate" showY={false} showZ={false}>
        <group>
          <arrowHelper args={[direction]} />
          {children}
        </group>
      </TransformControls>
    </>
  )
}
