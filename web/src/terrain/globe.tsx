// function to generate a list of xyz tiles
// based on zoom level

import { useFrame, useThree } from "@react-three/fiber";
import { MapTile, getTilesFromCamera } from "./lib";
import { PerspectiveCamera } from "three";
import { useState, useRef } from "react";
import { Tile } from "./tile";

export function TerrainGlobe() {
  const { camera } = useThree();
  const [tiles, setTiles] = useState<MapTile[]>([]);

  const prevTimeRef = useRef(0);

  useFrame((state) => {

    const time = state.clock.getElapsedTime();

    // Update the tiles every 0.1 seconds (or as needed)
    if (time - prevTimeRef.current > 0.1) {
      prevTimeRef.current = time;

      // Generate the new tiles based on the current camera view
      const newTiles = getTilesFromCamera(camera as PerspectiveCamera);

      // TODO: Frustum culling

      // TODO: Occlusion culling

      // Update the state with the new tiles

      // compare the tiles
      // if they are the same, don't update
      // if they are different, update

      let tilesAreDifferent = false;
      if (tiles.length !== newTiles.length) {
        tilesAreDifferent = true;
      } else {
        for (let i = 0; i < tiles.length; i++) {
          if (tiles[i].getKey() !== newTiles[i].getKey()) {
            tilesAreDifferent = true;
            break;
          }
        }
      }

      if (tilesAreDifferent) {
        // console.log("updating tiles");
        // console.log(newTiles);
        setTiles(newTiles);
      }
    }
  });

  return (
    <>
      <mesh visible={false}>
        <sphereBufferGeometry />
        <meshBasicMaterial color="#333" transparent opacity={1 - 0.12} />
      </mesh>
      {tiles.map((tile) => (
        <Tile tile={tile} key={tile.getKey()} />
      ))}
    </>
  );
}
