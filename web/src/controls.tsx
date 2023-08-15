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
  standardMaterial: false,
  useLUTs: false,
  exposure: 10,
  atmosphereSize: 100,
  toneMapping: 'ACESFilmicToneMapping',
})

export type Controls = {
  exposure: number
  debug: boolean
  terrainSize: number
  atmosphereSize: number
  standardMaterial: boolean
  toneMapping: string
  useLUTs: boolean
}

export default function () {
  const controls = useControls({
    exposure: 10,
    debug: false,
    terrainSize: 1,
    atmosphereSize: 100,
    standardMaterial: false,
    toneMapping: {
      value: 'ACESFilmicToneMapping',
      options: ['NoToneMapping', 'LinearToneMapping', 'ReinhardToneMapping', 'CineonToneMapping', 'ACESFilmicToneMapping'],
    },
    useLUTs: false,
  })
  const { exposure, debug, terrainSize, atmosphereSize, standardMaterial, toneMapping } = controls
  useFrame(({gl}) => {
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
