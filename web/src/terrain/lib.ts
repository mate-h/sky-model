import { Box3, Frustum, Matrix4, PerspectiveCamera, Vector3 } from "three";

// TODO: Memcache tiles

// Tiles are 256 × 256 pixel PNG files
// @2x for retina displays
//

const token =
  "pk.eyJ1IjoibWF0ZWgiLCJhIjoiY2pmOTEzbHo2MzU3cTJ3b201NDNkOXQxZiJ9.UYLkoWDRs877jt_-k4LH4g";
const sku = "101nAy1peUaxL";
export class MapTile {
  coords: Vector3;
  bounds: Box3;

  constructor(x: number, y: number, z: number) {
    this.coords = new Vector3(x, y, z);
    this.bounds = getTileBounds(this.coords);
  }

  getKey() {
    const [x, y, z] = this.coords.toArray();
    return [z, x, y].join("/");
  }

  getChildren() {
    const children: MapTile[] = [];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        children.push(
          new MapTile(
            2 * this.coords.x + i,
            2 * this.coords.y + j,
            this.coords.z + 1
          )
        );
      }
    }
    return children;
  }

  getTexture(type: "satellite" | "terrain" | "night") {
    const [x, y, z] = this.coords.toArray();
    const typeMap = {
      satellite: `https://api.mapbox.com/v4/mapbox.satellite/${z}/${x}/${y}@2x.webp?access_token=${token}&sku=${sku}`,
      terrain: `https://api.mapbox.com/raster/v1/mapbox.mapbox-terrain-dem-v1/${z}/${x}/${y}.webp?access_token=${token}&sku=${sku}`,
      night: "",
      // TODO: Add night map
      // night: ``
    };
    return typeMap[type];
  }
}

export function lon2tile(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat: number, zoom: number) {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

export function tile2lon(x: number, z: number): number {
  return (x / Math.pow(2, z)) * 2 * Math.PI - Math.PI;
}

export function tile2lat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

// Approximate Earth radius in meters
// const earthRadius = 6378137;
const earthRadius = 1;
export function lngLatToEarth(lng: number, lat: number): Vector3 {
  const x = earthRadius * Math.cos(lat) * Math.cos(lng);
  const y = earthRadius * Math.sin(lat); // Points to the north pole
  const z = earthRadius * Math.cos(lat) * Math.sin(lng);
  return new Vector3(x, y, z);
}

/**
 * Function to generate a list of xyz tiles
 * based on the camera view frustum
 * @param camera The camera to get the frustum from
 * @returns A list of xyz tiles
 */
export function getTilesFromCamera(camera: PerspectiveCamera) {
  // Get the camera view frustum
  const frustum = new Frustum();
  frustum.setFromProjectionMatrix(
    new Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
  );

  // Get the tiles that are in the frustum and face the camera
  const tiles: MapTile[] = [];

  // Initialize the quadtree traversal with the root tile
  const stack = [new MapTile(0, 0, 0)]; // Define the MapTile constructor as needed

  while (stack.length > 0) {
    const tile = stack.pop() as MapTile;

    // Skip this tile if it's not visible
    if (!tileInFrustum(tile, frustum)) continue;

    // Calculate distance to the tile
    const distance = distanceToTile(tile, camera);

    // Calculate the LOD level based on the distance to the camera
    // This is a simple heuristic and might need to be adjusted depending on your needs
    const lat = tile2lat(tile.coords.y, tile.coords.z);
    const absLat = Math.abs(lat);
    const logFactor = Math.pow(Math.log2(1 + absLat), 3);
    let lodLevel = Math.floor(Math.log2(earthRadius / distance));
    lodLevel = Math.min(6, Math.max(0, lodLevel + 3));

    // console.log(lodLevel);

    if (tile.coords.z < lodLevel) {
      // If the tile is closer than its LOD level, subdivide and push children to the stack
      // You need to define the method that calculates children tiles based on the current one
      const children = tile.getChildren();
      stack.push(...children);
    } else {
      // Otherwise, add the tile to the visible tiles
      tiles.push(tile);
    }
  }

  return tiles;
}

/**
 * Returns the tile bounding box in world space
 * @param coords The tile coordinates
 */
export function getTileBounds(coords: Vector3, numSamples: number = 7) {
  // Initialize bounding box
  const bounds = new Box3();

  // Subdivide the tile into a grid of sample points
  for (let i = 0; i <= numSamples; i++) {
    for (let j = 0; j <= numSamples; j++) {
      // Normalize i and j to range [0, 1] and calculate sample point coordinates
      const samplePoint = {
        x: coords.x + i / numSamples,
        y: coords.y + j / numSamples,
      };

      // Convert tile coordinates to lat/lon
      const lon = tile2lon(samplePoint.x, coords.z);
      const lat = tile2lat(samplePoint.y, coords.z);

      // Convert lat/lon to ECEF coordinates and expand bounding box
      const ecefCoords = lngLatToEarth(lon, lat);
      bounds.expandByPoint(ecefCoords);
    }
  }

  return bounds;
}

function tileInFrustum(tile: MapTile, frustum: Frustum): boolean {
  // Check if the bounding box of the tile intersects the frustum
  return frustum.intersectsBox(tile.bounds);
}

function distanceToTile(tile: MapTile, camera: PerspectiveCamera): number {
  // TODO: improve this function

  // Calculate the distance from the camera to the center of the tile's bounding box
  const tileCenter = tile.bounds.getCenter(new Vector3());
  return camera.position.distanceTo(tileCenter);
}

/**
 * Function to generate a list of xyz tiles
 * based on the zoom level
 * @param zoom The zoom level
 * @returns A list of xyz tiles
 */
export function getTilesByZoom(zoom: number) {
  const tiles: MapTile[] = [];
  const z = zoom;
  for (let x = 0; x < 2 ** z; x++) {
    for (let y = 0; y < 2 ** z; y++) {
      tiles.push(new MapTile(x, y, z));
    }
  }
  return tiles;
}
