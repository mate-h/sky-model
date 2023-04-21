import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export default function () {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />

      <mesh>
        <boxBufferGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      <OrbitControls />
    </Canvas>
  );
}
