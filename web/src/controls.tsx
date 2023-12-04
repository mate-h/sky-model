import { useControls } from 'leva'
import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
export const globalUniforms = {
  iAtmosphereSize: { value: 100 },
  iUseLut: { value: 0 },
}

export const controlsAtom = atom<Controls>({
  debug: false,
  terrainSize: 1,
  exposure: 3,
  atmosphereSize: 100,
  toneMapping: 'ACESFilmicToneMapping',
  useLut: false,
})

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
    useLut: true,
  })
  const { exposure, atmosphereSize, toneMapping, useLut } = controls
  useFrame(({ gl }) => {
    gl.toneMappingExposure = exposure
    // @ts-ignore
    gl.toneMapping = THREE[toneMapping]
  })
  useEffect(() => {
    globalUniforms.iAtmosphereSize.value = atmosphereSize
    globalUniforms.iUseLut.value = controls.useLut ? 1 : 0
  }, [atmosphereSize, useLut])
  const [, setControlsValue] = useAtom(controlsAtom)
  useEffect(() => {
    setControlsValue(controls)
  }, [controls])
  return <></>
}
