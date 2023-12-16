import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import {
  ClampToEdgeWrapping,
  HalfFloatType,
  LinearFilter,
  RGBAFormat,
  WebGL3DRenderTarget,
  WebGLRenderTarget,
} from 'three'

export function useRenderTarget({ scalar = 1 }: { scalar?: number } = {}) {
  const opts = {
    type: HalfFloatType,
  }
  const { size, viewport } = useThree()
  return useMemo(() => {
    const w = size.width * viewport.dpr * scalar
    const h = size.height * viewport.dpr * scalar
    return new WebGLRenderTarget(w, h, opts)
  }, [size, viewport])
}

export function use3DRenderTarget({
  width,
  height,
  depth,
}: {
  width: number
  height: number
  depth: number
}) {
  return useMemo(() => {
    const target = new WebGL3DRenderTarget(width, height, depth)
    const tex = target.texture
    tex.format = RGBAFormat
    tex.type = HalfFloatType
    tex.minFilter = LinearFilter
    tex.magFilter = LinearFilter
    tex.generateMipmaps = false
    tex.wrapS = tex.wrapT = tex.wrapR = ClampToEdgeWrapping
    return target
  }, [width, height, depth])
}
