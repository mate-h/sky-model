import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Scene, ShaderMaterial, WebGLRenderTarget } from 'three'
import vertexPass from './pass.vert'
import { ScreenQuad } from '@react-three/drei'
import { UniformGetter, UniformMaterial } from './uniforms'

type ShaderPassProps = {
  uniforms: UniformGetter
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
  const materialRef = useRef<ShaderMaterial>(null)
  useFrame(({ gl, camera }) => {
    const scene = root.current!
    if (!scene || !renderTarget) return
    scene.visible = true
    if (is3D) {
      const { depth } = renderTarget
      for (let i = 0; i < depth; i++) {
        gl.setRenderTarget(renderTarget, i)
        // set the iDepth uniform on the material
        const u = materialRef.current!.uniforms;
        if (u) {
          if (!u[depthName]) u[depthName] = { value: i }
          u[depthName].value = i
        }
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
        <UniformMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexPass}
          fragmentShader={fragmentShader}
          depthTest={false}
        />
      </ScreenQuad>
    </scene>
  )
}
