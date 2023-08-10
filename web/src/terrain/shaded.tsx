import { ShaderMaterial, Texture, TextureLoader, Vector3 } from 'three'
import mainFrag from './main.frag'
import mainVert from './main.vert'
import { useEffect, useRef, useState } from 'react'
import { useUniforms } from '../shader/uniforms'
import { SkyContext } from '../sky'
import { MapTile } from './lib'

function TerrainMaterial({
  aerialPerspective,
  transmittance,
  irradiance,
  sunDirection,
  multiScattering,
  terrainTexture,
  albedoTexture,
}: SkyContext & {
  terrainTexture: React.MutableRefObject<Texture | undefined>
  albedoTexture: React.MutableRefObject<Texture | undefined>
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
      iExposure: { value: 5 },
      iTerrainTexture: { value: terrainTexture.current },
      iAlbedoTexture: { value: albedoTexture.current },
    }
  })
  return <shaderMaterial ref={matRef} vertexShader={vs} fragmentShader={fs} />
}

function TerrainTile({
  aerialPerspective,
  transmittance,
  irradiance,
  sunDirection,
  multiScattering,
  coords,
  res = 128,
}: SkyContext & {
  coords: [number, number, number]
  res?: number
}) {
  const centerCoord = [181, 343, 10]
  const mapTile = new MapTile(...coords)
  // const mapTile = new MapTile(389, 578, 10)
  const terrainTexture = useRef<Texture>()
  const albedoTexture = useRef<Texture>()
  useEffect(() => {
    // load texture
    const loader = new TextureLoader()
    loader.load(mapTile.getTexture('terrain'), (texture) => {
      terrainTexture.current = texture
    })
    loader.load(mapTile.getTexture('satellite'), (texture) => {
      albedoTexture.current = texture
    })
  }, [coords])

  const s = 24
  const position = new Vector3(
    (coords[0] - centerCoord[0]) * s,
    (centerCoord[1] - coords[1]) * s,
    0
  )

  // dynamic LOD
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} >
      <mesh position={position}>
        <planeGeometry args={[s, s, res, res]} />
        <TerrainMaterial
          aerialPerspective={aerialPerspective}
          transmittance={transmittance}
          irradiance={irradiance}
          sunDirection={sunDirection}
          multiScattering={multiScattering}
          terrainTexture={terrainTexture}
          albedoTexture={albedoTexture}
        />
      </mesh>
    </group>
  )
}

export function Terrain(ctx: SkyContext) {
  const centerTile = [181, 343, 10];
  const N = 7;
  const O = Math.floor(N / 2);
  const nByNGrid = Array.from({ length: N * N }, (_, i) => {
    const x = i % N;
    const y = Math.floor(i / N);
    return [x, y];
  }).map(([x, y]) => {
    const [cx, cy, cz] = centerTile;
    return [cx + x - O, cy + y - O, cz];
  });
  return (
    <>
      {nByNGrid.map(([x, y, z]) => (
        <TerrainTile coords={[x, y, z]} {...ctx} />
      ))}
    </>
  )
}
