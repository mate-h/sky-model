import { useControls } from 'leva'
import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'

export const globalUniforms = {
  iExposure: { value: 10 },
  iAtmosphereSize: { value: 100 },
}

export const debugAtom = atom(false)

export const terrainSizeAtom = atom(1)

export const standardMaterialAtom = atom(false)

export default function () {
  const { exposure, debug, terrainSize, atmosphereSize, standardMaterial } = useControls({
    exposure: 10,
    debug: false,
    terrainSize: 1,
    atmosphereSize: 100,
    standardMaterial: false,
  })
  useEffect(() => {
    globalUniforms.iExposure.value = exposure
  }, [exposure])
  useEffect(() => {
    globalUniforms.iAtmosphereSize.value = atmosphereSize
  }, [atmosphereSize])
  const [, setDebugValue] = useAtom(debugAtom)
  useEffect(() => {
    setDebugValue(debug)
  }, [debug])
  const [, setStandardMaterial] = useAtom(standardMaterialAtom)
  useEffect(() => {
    setStandardMaterial(standardMaterial)
  }, [standardMaterial])

  const [, setTerrainSize] = useAtom(terrainSizeAtom)
  useEffect(() => {
    setTerrainSize(terrainSize)
  }, [terrainSize])

  return <></>
}
