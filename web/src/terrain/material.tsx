import { MeshStandardMaterial, Shader, ShaderMaterial, Texture } from 'three'
import { SkyContext } from '../sky'
import { useRef, useState } from 'react'
import mainFrag from './main.frag'
import mainVert from './main.vert'
import pbrFrag from './pbr.frag'
import { useUniforms } from '../shader/uniforms'
import { globalUniforms } from '../controls'
import { useRenderTarget } from '../shader/target'
import { RootState, useFrame, useThree } from '@react-three/fiber'
import { ShaderPass } from '../shader/pass'
import heightFrag from './height.frag'
import normalFrag from './normal.frag'
import { glsl } from '../glsl'

export function TerrainMaterial({
  aerialPerspective,
  transmittance,
  irradiance,
  sunDirection,
  multiScattering,
  terrainTexture,
  albedoTexture,
}: SkyContext & {
  terrainTexture: Texture | undefined
  albedoTexture: Texture | undefined
}) {
  const matRef = useRef<ShaderMaterial>(null)

  const [fs, setFs] = useState(mainFrag)
  const [vs, setVs] = useState(mainVert)
  import.meta.hot?.accept('./main.frag', (newModule) => {
    setFs(newModule!.default)
    matRef.current!.needsUpdate = true
  })
  import.meta.hot?.accept('./main.vert', (newModule) => {
    setVs(newModule!.default)
    matRef.current!.needsUpdate = true
  })
  useUniforms(matRef, (state) => {
    const w = state.size.width * state.viewport.dpr
    const h = state.size.height * state.viewport.dpr
    return {
      iResolution: { value: [w, h, 0] },
      iCameraWorld: { value: state.camera.matrixWorld },
      iCameraProjectionInverse: { value: state.camera.projectionMatrixInverse },
      iAerialPerspective: {
        value: aerialPerspective?.current,
      },
      iIrradiance: {
        value: irradiance?.current,
      },
      iSunDirection: {
        value: sunDirection?.current,
      },
      iTransmittance: {
        value: transmittance?.current,
      },
      iTime: {
        value: state.clock.elapsedTime,
      },
      iMultiScattering: {
        value: multiScattering?.current,
      },
      iTerrainTexture: { value: terrainTexture },
      iAlbedoTexture: { value: albedoTexture },
      ...globalUniforms,
    }
  })

  return <shaderMaterial ref={matRef} vertexShader={vs} fragmentShader={fs} />
}

export function TerrainStandardMaterial({
  aerialPerspective,
  transmittance,
  irradiance,
  sunDirection,
  multiScattering,
  terrainTexture,
  albedoTexture,
}: SkyContext & {
  terrainTexture: Texture | undefined
  albedoTexture: Texture | undefined
}) {
  const matRef = useRef<MeshStandardMaterial>(null)
  const heightMap = useRenderTarget()
  const normalMap = useRenderTarget()
  const shaderRef = useRef<Shader>()
  const getUniforms = (state: RootState) => {
    const w = state.size.width * state.viewport.dpr
    const h = state.size.height * state.viewport.dpr
    return {
      iResolution: { value: [w, h, 0] },
      iCameraWorld: { value: state.camera.matrixWorld },
      iCameraProjectionInverse: { value: state.camera.projectionMatrixInverse },
      iAerialPerspective: {
        value: aerialPerspective?.current,
      },
      iIrradiance: {
        value: irradiance?.current,
      },
      iSunDirection: {
        value: sunDirection?.current,
      },
      iTransmittance: {
        value: transmittance?.current,
      },
      iTime: {
        value: state.clock.elapsedTime,
      },
      iMultiScattering: {
        value: multiScattering?.current,
      },
      iTerrainTexture: { value: terrainTexture },
      iAlbedoTexture: { value: albedoTexture },
      ...globalUniforms,
    }
  }

  const state = useThree()
  function onBeforeCompile(shader: Shader) {
    
    shaderRef.current = shader

    // TODO: modify vertex shader to include map transform

    // TODO: modify fragment shader here to include atmosphere and volumetric shadows
    const u = getUniforms(state)
    shader.uniforms = { ...shader.uniforms, ...u }
    shader.vertexShader = shader.vertexShader.replace(
      glsl`#define STANDARD\n`,
      glsl`#define STANDARD\n#define USE_TRANSMISSION\n` +
        // prettier-ignore
        ``
    )
    shader.fragmentShader = shader.fragmentShader.replace(glsl`void main() {`, glsl`${pbrFrag}\nvoid main() {`)
    shader.fragmentShader = shader.fragmentShader.replace(
      glsl`#include <output_fragment>`,
      glsl`#include <output_fragment>\napplySkyLighting(diffuseColor.rgb, normal, gl_FragColor);` +
        // prettier-ignore
        ``
    )

    console.log(shader.fragmentShader)
  }

  useFrame((state) => {
    const u = getUniforms(state)
    if (shaderRef.current) {
      // TODO: may need to update uniforms by setting value
      shaderRef.current.uniforms = u
    }
  })

  return (
    <>
      <ShaderPass
        fragmentShader={heightFrag}
        uniforms={() => ({
          iTerrainTexture: { value: terrainTexture },
        })}
        renderTarget={heightMap}
      />
      <ShaderPass
        fragmentShader={normalFrag}
        uniforms={() => ({
          iTerrainTexture: { value: terrainTexture },
        })}
        renderTarget={normalMap}
      />
      <meshStandardMaterial
        onBeforeCompile={onBeforeCompile}
        ref={matRef}
        displacementMap={heightMap.texture}
        normalMap={normalMap.texture}
        map={albedoTexture}
      />
    </>
  )
}
