import { useControls } from 'leva'
import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'

export const globalUniforms = {
  iExposure: { value: 10 },
}

export const debugAtom = atom(false)

export default function () {
  const { exposure, debug } = useControls({ exposure: 10, debug: false })
  useEffect(() => {
    globalUniforms.iExposure.value = exposure
  }, [exposure])
  const [_, setDebugValue] = useAtom(debugAtom)
  useEffect(() => {
    setDebugValue(debug)
  }, [debug])

  return <></>
}
