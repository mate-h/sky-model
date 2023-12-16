import { useControls } from 'leva'
import { Perf } from 'r3f-perf'
import { LineBasicMaterial } from 'three'

export const Debug = () => {
  const { debug } = useControls({ debug: false })
  if (!debug) return null
  return (
    <>
      <Perf position="top-left" />
      <gridHelper
        position={[0, 0, 0]}
        args={[1000, 100, 0xffffff, 0xffffff]}
        material={
          new LineBasicMaterial({
            color: 0xffffff,
            opacity: 0.2,
            transparent: true,
            depthTest: false,
          })
        }
      />
      <axesHelper args={[10]} position={[0, 3.01, 0]} />
    </>
  )
}
