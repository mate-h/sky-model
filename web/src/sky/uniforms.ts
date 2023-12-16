import { useControls } from 'leva'
import { useEffect } from 'react'

const skyUniforms = {
  iAtmosphereSize: { value: 100 },
  iUseLut: { value: 0 },
}

export type Controls = {
  exposure: number
  debug: boolean
  terrainSize: number
  atmosphereSize: number
  toneMapping: string
  useLut: boolean
}

export function useSkyUniforms() {
  const controls = useControls({
    terrainSize: {
      value: 1,
      min: 1,
      step: 1,
      max: 9,
    },
    atmosphereSize: 100,
    
    useLut: true,
  })
  const { atmosphereSize, useLut } = controls
  useEffect(() => {
    skyUniforms.iAtmosphereSize.value = atmosphereSize
    skyUniforms.iUseLut.value = controls.useLut ? 1 : 0
  }, [atmosphereSize, useLut])
  return skyUniforms;
}
