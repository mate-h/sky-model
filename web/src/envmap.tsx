import { useLoader, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { PMREMGenerator } from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

export function Sky() {
  // @ts-ignore
  const texture = useLoader(EXRLoader, '/sunflowers_puresky_4k.exr')
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmRemGenerator = new PMREMGenerator(gl)
    pmRemGenerator.compileEquirectangularShader()
    const target = pmRemGenerator.fromEquirectangular(texture)
    const envMap = target.texture
    scene.background = envMap
    scene.environment = envMap
  }, [gl, texture, scene])
  return <></>
}
