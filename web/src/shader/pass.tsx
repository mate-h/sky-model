import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { IUniform, Scene, WebGL3DRenderTarget, WebGLRenderTarget } from 'three'
import vertexPass from './pass.vert'
import { ScreenQuad } from '@react-three/drei'

type ShaderPassProps = {
  uniforms: Record<string, IUniform>
  fragmentShader: string
  renderTarget: WebGLRenderTarget
  depthName?: string
}

/**
 * Shader pass component for performing post-processing effects
 * or compute shaders
 */
export function ShaderPass({
  fragmentShader,
  renderTarget,
  uniforms,
  depthName = 'iDepth',
}: ShaderPassProps) {
  const root = useRef<Scene>(null)
  const is3D = renderTarget.depth > 0
  useFrame(({ gl, camera }) => {
    const scene = root.current!
    if (!scene || !renderTarget) return
    scene.visible = true
    if (is3D) {
      const { depth } = renderTarget;
      for (let i = 0; i < depth; i++) {
        gl.setRenderTarget(renderTarget, i)
        if (!uniforms[depthName]) uniforms[depthName] = { value: i }
        uniforms[depthName].value = i / depth
        gl.render(scene, camera)
      }
    } else {
      gl.setRenderTarget(renderTarget)
      gl.render(scene, camera)
    }
    scene.visible = false
    gl.setRenderTarget(null)
  })
  return (
    <scene ref={root}>
      <ScreenQuad>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexPass}
          fragmentShader={fragmentShader}
          depthTest={false}
        />
      </ScreenQuad>
    </scene>
  )
}
