import { useControls } from 'leva'
import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
// scene uniforms
export const globalUniforms = {
  iValue: { value: 0 },
}

export type Controls = {
  exposure: number
  debug: boolean
  terrainSize: number
  atmosphereSize: number
  toneMapping: string
  useLut: boolean
}

export default function () {
  const controls = useControls({
    exposure: {
      value: 3,
      min: 0,
    },
    value: {
      value: 0,
      min: 0,
      max: 1,
    },
    toneMapping: {
      value: 'ACESFilmicToneMapping',
      options: [
        'NoToneMapping',
        'LinearToneMapping',
        'ReinhardToneMapping',
        'CineonToneMapping',
        'ACESFilmicToneMapping',
      ],
    },
  })
  const { exposure, value, toneMapping } = controls
  useFrame(({ gl }) => {
    gl.toneMappingExposure = exposure
    // @ts-ignore
    gl.toneMapping = THREE[toneMapping]
  })
  useEffect(() => {
    globalUniforms.iValue.value = value
  }, [value])
  return <></>
}
