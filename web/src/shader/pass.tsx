import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import {
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  WebGLMultipleRenderTargets,
} from 'three'
import vertexPass from './pass.vert'
import { ScreenQuad } from '@react-three/drei'
import { UniformGetter, UniformMaterial } from './uniforms'

type ShaderPassProps = {
  uniforms: UniformGetter
  fragmentShader: string
  renderTarget: WebGLRenderTarget | WebGLMultipleRenderTargets | [WebGLRenderTarget, WebGLRenderTarget]
  depthName?: string
  once?: boolean
  matRef?: React.RefObject<ShaderMaterial>
  readTarget?: React.MutableRefObject<number>
}

export function ShaderPass({
  fragmentShader,
  renderTarget,
  uniforms,
  depthName = 'iDepth',
  once = false,
  matRef,
  readTarget = { current: 0 },
}: ShaderPassProps) {
  const root = useRef<Scene>(null)
  const materialRef = matRef || useRef<ShaderMaterial>(null)
  let frames = 0
  // const [currentRenderTarget, setCurrentRenderTarget] = useState(0)

  useFrame(({ gl, camera }) => {
    if (once && frames > 0) return

    const scene = root.current!
    if (!scene) return

    scene.visible = true

    let target;
    const isDoubleBuffered = Array.isArray(renderTarget);
    const is3D = renderTarget instanceof WebGLMultipleRenderTargets || (isDoubleBuffered && renderTarget[0] instanceof WebGLMultipleRenderTargets);

    if (isDoubleBuffered) {
      // Use one of the two render targets for double buffering
      target = renderTarget[readTarget.current];
    } else {
      // Use the single render target
      target = renderTarget;
    }

    if (is3D) {
      const depth = isDoubleBuffered ? renderTarget[0].depth : renderTarget.depth;
      for (let i = 0; i < depth; i++) {
        gl.setRenderTarget(target, i)
        if (materialRef.current) {
          const u = materialRef.current.uniforms
          if (!u[depthName]) u[depthName] = { value: i }
          u[depthName].value = i
        }
        gl.render(scene, camera)
      }
    } else {
      gl.setRenderTarget(target)
      gl.render(scene, camera)
    }

    scene.visible = false
    gl.setRenderTarget(null)

    if (isDoubleBuffered) {
      // Swap render targets for the next frame
      readTarget.current = 1 - readTarget.current
    }

    frames += 1
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
