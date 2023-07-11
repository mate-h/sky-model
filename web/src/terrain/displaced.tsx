// flat terrain model
import frag from './solid.frag'
import vert from './displace.vert'
import mainFrag from './main.frag'
import { useRef, useState } from 'react'
import { ShaderMaterial } from 'three'
import { useTexture } from '@react-three/drei'
import { MapTile } from './lib'
import { SkyContext } from '../sky'
import { useUniforms } from '../shader/uniforms'

// test coordinates
const [x, y, z] = [181, 343, 10]

export function TerrainDisplaced({ context }: { context: SkyContext }) {
  // Extract your original tile coordinates
  const grid = [] // Start with an empty grid
  const n = 1

  // Generate a nxn grid centered on the original coordinates
  for (let dx = -n; dx <= n; dx++) {
    for (let dy = -n; dy <= n; dy++) {
      const tile = new MapTile(x + dx, y + dy, z)
      grid.push(tile)
    }
  }

  return (
    <group>
      {grid.map((tile, index) => (
        <DisplacedTile context={context} key={index} tile={tile} />
      ))}
    </group>
  )
}

export function DisplacedTile({
  tile,
  context,
}: {
  tile: MapTile
  context: SkyContext
}) {
  const subdiv = 128
  const terrainTexture = useTexture(tile.getTexture('terrain'))
  const material = useRef<ShaderMaterial>(null)
  const [fs, setFs] = useState(mainFrag)
  const [vs, setVs] = useState(vert)
  import.meta.hot?.accept('./main.frag', (newModule) => {
    setFs(newModule!.default)
    material.current!.needsUpdate = true
  })
  import.meta.hot?.accept('./displace.vert', (newModule) => {
    setVs(newModule!.default)
    material.current!.needsUpdate = true
  })

  useUniforms(material, (state) => {
    const w = state.size.width * state.viewport.dpr
    const h = state.size.height * state.viewport.dpr
    return {
      iResolution: { value: [w, h, 0] },
      iCameraWorld: { value: state.camera.matrixWorld },
      iCameraProjectionInverse: { value: state.camera.projectionMatrixInverse },
      iAerialPerspective: {
        value: context.aerialPerspective?.current,
      },
      iIrradiance: {
        value: context.irradiance?.current,
      },
      iSunDirection: {
        value: context.sunDirection?.current,
      },
      iTransmittance: {
        value: context.transmittance?.current,
      },
      iTime: {
        value: state.clock.elapsedTime,
      },
      iExposure: { value: 20 },
      iTerrainTexture: { value: terrainTexture },
    }
  })
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[tile.coords.x - x, 0, tile.coords.y - y]}
    >
      <planeBufferGeometry args={[1, 1, subdiv, subdiv]} />
      <shaderMaterial
        ref={material}
        vertexShader={vs}
        fragmentShader={fs}
      />
    </mesh>
  )
}
