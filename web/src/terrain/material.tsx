import {
  MeshStandardMaterial,
  Shader,
  ShaderMaterial,
  Texture,
  TextureLoader,
} from 'three'
import { SkyContext } from '../sky'
import { useEffect, useRef, useState } from 'react'
import mainFrag from './main.frag'
import mainVert from './main.vert'
import pbrFrag from './pbr.frag'
import { useUniforms } from '../shader/uniforms'
import { useSkyUniforms } from '../sky/uniforms'
import { useRenderTarget } from '../shader/target'
import { RootState, useFrame, useThree } from '@react-three/fiber'
import { ShaderPass } from '../shader/pass'
import heightFrag from './height.frag'
import normalFrag from './normal.frag'
import { glsl } from '../glsl'
import { MapTile } from './lib'

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
  const skyUniforms = useSkyUniforms()

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
      ...skyUniforms,
    }
  })

  return <shaderMaterial ref={matRef} vertexShader={vs} fragmentShader={fs} />
}

type Props = SkyContext & {
  // terrainTexture: Texture | undefined
  // albedoTexture: Texture | undefined

  mapTile: MapTile
  outputPosition?: boolean
}

const loader = new TextureLoader()
export const TerrainStandardMaterial = (props: Props) => {
  const {
    aerialPerspective,
    transmittance,
    irradiance,
    sunDirection,
    multiScattering,
    mapTile,
  } = props

  const matRef = useRef<MeshStandardMaterial>(null)
  const [albedoTexture, setAlbedo] = useState<Texture | undefined>(undefined)
  const [terrainTexture, setTerrain] = useState<Texture | undefined>(undefined)
  useEffect(() => {
    // load texture
    loader.load(mapTile.getTexture('terrain'), (texture) => {
      setTerrain(texture)
    })
    loader.load(mapTile.getTexture('satellite'), (texture) => {
      setAlbedo(texture)
    })
  }, [mapTile])

  const heightMap = useRenderTarget()
  const normalMap = useRenderTarget()
  const shaderRef = useRef<Shader>()
  const skyUniforms = useSkyUniforms()
  const getUniforms = (state: RootState) => {
    const w = state.size.width * state.viewport.dpr
    const h = state.size.height * state.viewport.dpr
    return {
      iResolution: { value: [w, h, 0] },
      iCameraWorld: { value: state.camera.matrixWorld },
      iCameraProjectionInverse: {
        value: state.camera.projectionMatrixInverse,
      },
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
      ...skyUniforms,
    }
  }

  const state = useThree()
  function onBeforeCompile(shader: Shader) {
    shaderRef.current = shader
    return;

    // console.log(shader.fragmentShader);

    // TODO: modify vertex shader to include map transform

    // TODO: modify fragment shader here to include atmosphere and volumetric shadows
    const u = getUniforms(state)
    shader.uniforms = { ...shader.uniforms, ...u }
    shader.vertexShader = shader.vertexShader.replace(
      `#define STANDARD\n`,
      `#define STANDARD\n#define USE_TRANSMISSION\n`
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      `void main() {`,
      `${pbrFrag}\nvoid main() {`
    )

    if (!props.outputPosition) {
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <opaque_fragment>`,
        `applySkyLighting(diffuseColor.rgb, normal, outgoingLight);\n  #include <opaque_fragment>`
      )
    } else {
      // append after #include <dithering_fragment>
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `#include <dithering_fragment>\ngl_FragColor = vec4(diffuseColor.rgb, 1.0);\n`
      )
    }
  }

  useEffect(() => {
    if (shaderRef.current) {
      const u = getUniforms(state)
      shaderRef.current.uniforms = u
      requestAnimationFrame(() => {
        matRef.current!.needsUpdate = true
      })
    }
  }, [terrainTexture, albedoTexture])

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
        roughness={1}
        metalness={0}
        color="white"
      />
      {/* <meshNormalMaterial
        
        displacementMap={heightMap.texture}
        normalMap={normalMap.texture}
      /> */}
    </>
  )
}
