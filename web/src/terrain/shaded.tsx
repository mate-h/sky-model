import {
  BackSide,
  DirectionalLight,
  DirectionalLightHelper,
  FrontSide,
  MeshStandardMaterial,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three'
import mainFrag from './main.frag'
import mainVert from './main.vert'
import heightFrag from './height.frag'
import normalFrag from './normal.frag'
import { useEffect, useRef, useState } from 'react'
import { useUniforms } from '../shader/uniforms'
import { SkyContext, sunDirection } from '../sky'
import { MapTile } from './lib'
import {
  globalUniforms,
  standardMaterialAtom,
  terrainSizeAtom,
} from '../controls'
import { useAtom } from 'jotai'
import { ShaderPass } from '../shader/pass'
import { useRenderTarget } from '../shader/target'
import { useHelper } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'

function TerrainMaterial({
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

let centerCoord = [181, 343, 10]
let s = 26
// centerCoord = [192, 401, 10]
// centerCoord = [165, 360, 10]
// centerCoord = [840, 535, 10]; s = 38

const loader = new TextureLoader()
function TerrainTile({
  aerialPerspective,
  transmittance,
  irradiance,
  sunDirection,
  multiScattering,
  coords,
  res = 512,
}: SkyContext & {
  coords: [number, number, number]
  res?: number
}) {
  const mapTile = new MapTile(...coords)
  // const mapTile = new MapTile(389, 578, 10)
  // const terrainTexture = useRef<Texture>()
  const [albedoTexture, setAlbedo] = useState<Texture | undefined>(undefined)

  const [terrainTexture, setTerrain] = useState<Texture | undefined>(undefined)
  const matRef = useRef<MeshStandardMaterial>(null)
  useEffect(() => {
    // load texture
    loader.load(mapTile.getTexture('terrain'), (texture) => {
      setTerrain(texture)
      matRef.current!.needsUpdate = true
    })
    loader.load(mapTile.getTexture('satellite'), (texture) => {
      setAlbedo(texture)
      matRef.current!.needsUpdate = true
    })
  }, [coords])

  const position = new Vector3(
    (coords[0] - centerCoord[0]) * s,
    (centerCoord[1] - coords[1]) * s,
    0
  )

  const heightMap = useRenderTarget()
  const normalMap = useRenderTarget()

  const [standardMaterial] = useAtom(standardMaterialAtom)

  // dynamic LOD
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
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
      <mesh position={position} receiveShadow castShadow>
        <planeGeometry args={[s, s, res, res]} />

        {!standardMaterial && (
          <TerrainMaterial
            aerialPerspective={aerialPerspective}
            transmittance={transmittance}
            irradiance={irradiance}
            sunDirection={sunDirection}
            multiScattering={multiScattering}
            terrainTexture={terrainTexture}
            albedoTexture={albedoTexture}
          />
        )}

        {standardMaterial && (
          <meshStandardMaterial
            ref={matRef}
            displacementMap={heightMap.texture}
            normalMap={normalMap.texture}
            map={albedoTexture}
          />
        )}
      </mesh>
    </group>
  )
}

export function Terrain(ctx: SkyContext) {
  const [N] = useAtom(terrainSizeAtom)
  const O = Math.floor(N / 2)
  const nByNGrid = Array.from({ length: N * N }, (_, i) => {
    const x = i % N
    const y = Math.floor(i / N)
    return [x, y]
  }).map(([x, y]) => {
    const [cx, cy, cz] = centerCoord
    return [cx + x - O, cy + y - O, cz]
  })

  const lightRef = useRef<DirectionalLight>(null)
  // @ts-ignore
  useHelper(lightRef, DirectionalLightHelper, 1, 'red')

  useFrame(() => {
    const s = lightRef.current!.shadow
    s.normalBias = 0.03
    s.camera.far = 24
    s.camera.near = -24
    s.camera.left = -24
    s.camera.right = 24
    s.mapSize.width = 1024
    s.mapSize.height = 1024
    lightRef.current!.position.copy(sunDirection)
  })
  return (
    <>
      <directionalLight ref={lightRef} castShadow />
      <hemisphereLight intensity={.1} />

      {/* <mesh position={[0,5,0]} castShadow>
        <sphereGeometry />
        <meshStandardMaterial />
      </mesh> */}
      {nByNGrid.map(([x, y, z]) => (
        <TerrainTile key={`${x}-${y}-${z}`} coords={[x, y, z]} {...ctx} />
      ))}
    </>
  )
}
