import { ShaderMaterial, Texture, TextureLoader } from 'three'
import mainFrag from './main.frag'
import mainVert from './main.vert'
import { useEffect, useRef, useState } from 'react'
import { useUniforms } from '../shader/uniforms'
import { SkyContext } from '../sky'
import { MapTile } from './lib'
import { ScreenQuad } from '@react-three/drei'
import vertPass from '../shader/pass.vert'

export function Terrain({
  aerialPerspective,
  transmittance,
  irradiance,
  sunDirection,
}: SkyContext) {
  const matRef = useRef<ShaderMaterial>(null)
  const mapTile = new MapTile(181, 343, 10)
  const terrainTexture = useRef<Texture>()
  const albedoTexture = useRef<Texture>()
  useEffect(() => {
    // load texture
    const loader = new TextureLoader()
    loader.load(mapTile.getTexture('terrain'), (texture) => {
      terrainTexture.current = texture
      matRef.current!.needsUpdate = true
    })
    loader.load(mapTile.getTexture('satellite'), (texture) => {
      albedoTexture.current = texture
      matRef.current!.needsUpdate = true
    })
  }, [])
  const [fs, setFs] = useState(mainFrag)
  import.meta.hot?.accept('./main.frag', (newModule) => {
    setFs(newModule!.default)
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
      iExposure: { value: 20 },
      iTerrainTexture: { value: terrainTexture.current },
      iAlbedoTexture: { value: albedoTexture.current },
    }
  })

  // return (
  //   <>
  //     <ScreenQuad>
  //       <shaderMaterial
  //         ref={matRef}
  //         fragmentShader={/*glsl*/`
  //         precision highp sampler3D;
  //         uniform float iTime;
  //         uniform sampler3D iAerialPerspective;

  //         in vec2 vUv;

  //         void main() {
  //           vec3 uvw = vec3(vUv, sin(iTime));
  //           vec3 color = texture(iAerialPerspective, uvw).rgb;
  //           gl_FragColor = vec4(vUv, 0., 1.0);

  //           // #include <tonemapping_fragment>
  //         }
  //         `}
  //         vertexShader={vertPass}
  //       />
  //     </ScreenQuad>
  //   </>
  // )

  // dynamic LOD
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10, 514, 514]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={mainVert}
        fragmentShader={fs}
      />
    </mesh>
  )
}
