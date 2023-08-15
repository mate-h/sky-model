import {
  DirectionalLight,
  MeshStandardMaterial,
  Texture,
  TextureLoader,
  Vector3,
} from 'three'
import { useEffect, useRef, useState } from 'react'
import { SkyContext, sunDirection } from '../sky'
import { MapTile } from './lib'
import { useAtom } from 'jotai'
import { useFrame } from '@react-three/fiber'
import { TerrainMaterial, TerrainStandardMaterial } from './material'
import { useControls } from 'leva'

let centerCoord = [181, 343, 10]
let s = 26
// centerCoord = [192, 401, 10]
// centerCoord = [165, 360, 10]
// centerCoord = [840, 535, 10]; s = 38
// centerCoord = [2583, 5595, 14]; s = 3

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
  useEffect(() => {
    // load texture
    loader.load(mapTile.getTexture('terrain'), (texture) => {
      setTerrain(texture)
    })
    loader.load(mapTile.getTexture('satellite'), (texture) => {
      setAlbedo(texture)
    })
  }, [coords])

  const position = new Vector3(
    (coords[0] - centerCoord[0]) * s,
    (centerCoord[1] - coords[1]) * s,
    0
  )

  const {standardMaterial} = useControls({standardMaterial: false});

  // dynamic LOD
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
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
          <TerrainStandardMaterial
            aerialPerspective={aerialPerspective}
            transmittance={transmittance}
            irradiance={irradiance}
            sunDirection={sunDirection}
            multiScattering={multiScattering}
            terrainTexture={terrainTexture}
            albedoTexture={albedoTexture}
          />
        )}
      </mesh>
    </group>
  )
}

export function Terrain(ctx: SkyContext) {
  const {terrainSize: N} = useControls({terrainSize: 1})
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
      <directionalLight ref={lightRef} castShadow intensity={1} />
      {/* <hemisphereLight intensity={0.1} /> */}

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
