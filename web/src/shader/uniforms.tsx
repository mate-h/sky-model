import {
  RootState,
  ShaderMaterialProps,
  useFrame,
  useThree,
} from '@react-three/fiber'
import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react'
import { IUniform, ShaderMaterial } from 'three'

export type UniformGetter = (s: RootState) => Record<string, IUniform>


export function useUniforms(
  ref?: React.MutableRefObject<ShaderMaterial | null>,
  getter?: UniformGetter
) {
  const state = useThree()
  // set initial state
  useLayoutEffect(() => {
    if (!ref?.current || !getter) return
    ref.current.uniforms = getter(state)
  }, [ref, state])
  // update uniforms
  useFrame((state) => {
    if (!ref?.current || !getter) return
    const newUniforms = getter(state)
    Object.keys(newUniforms).forEach((key) => {
      // @ts-ignore
      ref.current.uniforms[key].value = newUniforms[key].value
    })
  })
}

type Props = Omit<ShaderMaterialProps, 'uniforms'> & {
  uniforms: UniformGetter
}


export const UniformMaterial = forwardRef<ShaderMaterial, Props>(
  ({ uniforms, ...rest }, outerRef) => {
    const materialRef = useRef<ShaderMaterial>(null)
    useUniforms(materialRef, uniforms)

    useEffect(() => {
      if (outerRef) {
        // @ts-ignore
        outerRef.current = materialRef.current
      }
    }, [outerRef, uniforms])

    return <shaderMaterial ref={materialRef} {...rest} />
  }
)
