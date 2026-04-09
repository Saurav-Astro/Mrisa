import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// The central glowing crystal
function Crystal() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current && lightRef.current) {
      // Rotate the crystal
      meshRef.current.rotation.y = time * 0.2;
      // Make the light pulse
      lightRef.current.intensity = 1 + Math.sin(time * 2) * 0.5;
    }
  });

  return (
    <group>
      <pointLight ref={lightRef} color="#00ffdd" distance={10} intensity={1.5} />
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={1}
          roughness={0.1}
          emissive="#00ffdd"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

// The swirling particle nebula
function ParticleNebula() {
  // --- FIX: Changed the ref type from THREE.Points to THREE.InstancedMesh ---
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 5000; i++) {
      const time = Math.random() * 100;
      // Spread particles in a sphere
      const factor = 4 + Math.random() * 5; 
      const speed = 0.005 + Math.random() / 200;
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ).normalize().multiplyScalar(factor);

      temp.push({ time, factor, speed, x: pos.x, y: pos.y, z: pos.z });
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (meshRef.current) {
      particles.forEach((particle, i) => {
        const { factor, speed } = particle;
        const t = (particle.time += speed);
        
        // Swirling motion logic
        dummy.position.set(
          particle.x + Math.cos(t) * (factor / 10),
          particle.y + Math.sin(t) * (factor / 10),
          particle.z + Math.sin(t) * (factor / 10)
        );

        dummy.updateMatrix();
        // This method only exists on InstancedMesh, which is why the ref type was critical
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;

      // Make the whole nebula react to the mouse
      const targetRotationY = (state.mouse.x * Math.PI) / 4;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotationY,
        0.05
      );
    }
  });

  return (
    // We pass the number of instances (5000) as the last argument here
    <instancedMesh ref={meshRef} args={[undefined, undefined, 5000]}>
      <sphereGeometry args={[0.05, 4, 4]} />
      <meshBasicMaterial color="#00ffdd" />
    </instancedMesh>
  );
}

// The main scene component
export const NotFoundScene = () => {
  return (
    <div className="absolute inset-0 -z-10 bg-black">
      <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
        <fog attach="fog" args={["#000a0f", 20, 40]} />
        <ambientLight intensity={0.1} />
        <Crystal />
        <ParticleNebula />
      </Canvas>
    </div>
  );
};