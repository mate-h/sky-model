import { useControls } from 'leva'
import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
export const globalUniforms = {
  iAtmosphereSize: { value: 100 },
}

export const controlsAtom = atom<Controls>({
  debug: false,
  terrainSize: 1,
  exposure: 3,
  atmosphereSize: 100,
  toneMapping: 'ACESFilmicToneMapping',
})

export type Controls = {
  exposure: number
  debug: boolean
  terrainSize: number
  atmosphereSize: number
  toneMapping: string
}

export default function () {
  const controls = useControls({
    exposure: {
      value: 3,
      min: 0,
    },
    debug: false,
    terrainSize: {
      value: 1,
      min: 1,
      step: 1,
      max: 9,
    },
    atmosphereSize: 100,
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
  const { exposure, atmosphereSize, toneMapping } = controls
  useFrame(({ gl }) => {
    gl.toneMappingExposure = exposure
    // @ts-ignore
    gl.toneMapping = THREE[toneMapping]
  })
  useEffect(() => {
    globalUniforms.iAtmosphereSize.value = atmosphereSize
  }, [atmosphereSize])
  const [, setControlsValue] = useAtom(controlsAtom)
  useEffect(() => {
    setControlsValue(controls)
  }, [controls])
  return <></>
}
