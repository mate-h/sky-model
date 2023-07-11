// function to generate a list of xyz tiles
// based on zoom level

import { useFrame } from "@react-three/fiber";
import { MapTile } from "./lib";
import {
  BoxGeometry,
  DoubleSide,
  Frustum,
  LineBasicMaterial,
  Matrix4,
  PerspectiveCamera,
  ShaderMaterial,
  Vector3,
} from "three";
import { useMemo, useRef, useState } from "react";
import vertexShader from "./tile.vert";
import fragmentShader from "./tile.frag";

const BoundingBox = ({ tile }: { tile: MapTile }) => {
  const geom = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const vector = useMemo(() => new Vector3(0, 0, 0), []);
  const lineMaterial = useRef<LineBasicMaterial>(null);
  const frustum = useMemo(() => new Frustum(), []);
  const matrix = useMemo(() => new Matrix4(), []);
  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    // determine whether tile intersects the view frustum
    frustum.setFromProjectionMatrix(
      matrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
    );
    let intersects = frustum.intersectsBox(tile.bounds);

    // temporary over write intersects
    // if (tile.coords.z > state.clock.elapsedTime) intersects = false;

    // set color based on intersection
    lineMaterial.current!.color.set(intersects ? "red" : "blue");
  });
  return (
    <lineSegments
      position={tile.bounds.getCenter(vector.clone())}
      scale={tile.bounds.getSize(vector.clone())}
    >
      <edgesGeometry attach="geometry" args={[geom]} />
      <lineBasicMaterial ref={lineMaterial} attach="material" />
    </lineSegments>
  );
};

export function Tile({ tile }: { tile: MapTile }) {
  const material = useRef<ShaderMaterial>(null);

  const [fs, setFs] = useState(fragmentShader);
  const [vs, setVs] = useState(vertexShader);
  import.meta.hot?.accept("./tile.frag", (newModule) => {
    setFs(newModule!.default);
    material.current!.needsUpdate = true;
  });
  import.meta.hot?.accept("./tile.vert", (newModule) => {
    setVs(newModule!.default);
    material.current!.needsUpdate = true;
  });

  return (
    <>
      {/* <BoundingBox tile={tile} /> */}
      <mesh>
        <planeGeometry args={[2, 2, 8, 8]} />
        <shaderMaterial
          ref={material}
          // wireframe
          // side={DoubleSide}
          vertexShader={vs}
          fragmentShader={fs}
          uniforms={{
            iTileCoords: { value: tile.coords },
          }}
        />
      </mesh>
    </>
  );
}
