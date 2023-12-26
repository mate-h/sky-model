import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import {
  ClampToEdgeWrapping,
  HalfFloatType,
  LinearFilter,
  RGBAFormat,
  WebGL3DRenderTarget,
  WebGLMultipleRenderTargets,
  WebGLRenderTarget,
} from 'three'

type RenderTargetProps = { scalar?: number; width?: number; height?: number }
export function useRenderTarget({
  scalar = 1,
  width,
  height,
}: RenderTargetProps = {}) {
  const opts = {
    type: HalfFloatType,
  }
  const { size, viewport } = useThree()
  return useMemo(() => {
    let w = size.width * viewport.dpr * scalar
    let h = size.height * viewport.dpr * scalar
    if (width) w = width
    if (height) h = height
    return new WebGLRenderTarget(w, h, opts)
  }, [size, viewport])
}

type MultiRenderTargetProps = {
  scalar?: number
  width?: number
  height?: number
  count?: number
}
export function useMultiRenderTarget({
  scalar = 1,
  count = 1,
  width,
  height,
}: MultiRenderTargetProps = {}) {
  const opts = {
    type: HalfFloatType,
  }
  const { size, viewport } = useThree()
  return useMemo(() => {
    let w = size.width * viewport.dpr * scalar
    let h = size.height * viewport.dpr * scalar
    if (width) w = width
    if (height) h = height
    return new WebGLMultipleRenderTargets(w, h, count, opts)
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
