import { OrbitControls } from '@react-three/drei'
import { Sky } from '.'
import Controls from '../controls'
import { Terrain } from '../terrain/shaded'
import { useRef } from 'react'
import { Data3DTexture, Texture, Vector3 } from 'three'

export const SkyScene = () => {
  const aerialPerspective = useRef<Data3DTexture>()
  const irradiance = useRef<Texture>()
  const transmittance = useRef<Texture>()
  const sunDirection = useRef<Vector3>()
  const multiScattering = useRef<Texture>()

  return (
    <>
      <Controls />
      <Sky
        aerialPerspective={aerialPerspective}
        irradiance={irradiance}
        transmittance={transmittance}
        sunDirection={sunDirection}
        multiScattering={multiScattering}
      />

      <Terrain
        aerialPerspective={aerialPerspective}
        irradiance={irradiance}
        transmittance={transmittance}
        sunDirection={sunDirection}
        multiScattering={multiScattering}
      />
      {/* maxDistance={100} minDistance={1} maxPolarAngle={Math.PI/2} */}
      <OrbitControls makeDefault />
    </>
  )
}
