import { TransformControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useAtom } from 'jotai'
import { useLayoutEffect, useRef } from 'react'
import { Quaternion, Vector3 } from 'three'
import { useControls } from 'leva'

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
  direction,
  damping = 0.05,
}: Props) {
  const controlsRef = useRef<any>()
  const {debug} = useControls({debug: false});
  useLayoutEffect(() => {
    if (!debug) return;
    // set default direction to direction prop
    controlsRef.current!.object.quaternion.setFromUnitVectors(
      new Vector3(0, 0, -1),
      direction
    )
  }, [debug])
  useFrame(() => {
    if (!debug) return;
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
  
  if (!debug) return <>{children}</>
  return (
    <>
      <TransformControls ref={controlsRef} mode="rotate">
        <group>
          <arrowHelper args={[direction]} />
          {children}
        </group>
      </TransformControls>
    </>
  )
}
