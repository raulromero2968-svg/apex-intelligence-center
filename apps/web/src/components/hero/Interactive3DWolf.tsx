'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Low-poly wolf head geometry vertices
function createWolfGeometry() {
  const geometry = new THREE.BufferGeometry();
  
  // Define vertices for a low-poly wolf head (front-facing)
  const vertices = new Float32Array([
    // Front face - snout
    0, -0.5, 1,      // 0: bottom center
    -0.3, -0.3, 0.8, // 1: bottom left
    0.3, -0.3, 0.8,  // 2: bottom right
    0, 0, 1.2,       // 3: snout tip
    
    // Mid face
    -0.6, 0, 0.5,    // 4: left cheek
    0.6, 0, 0.5,     // 5: right cheek
    -0.4, 0.3, 0.6,  // 6: left eye area
    0.4, 0.3, 0.6,   // 7: right eye area
    
    // Upper face - forehead
    0, 0.8, 0.4,     // 8: forehead center
    -0.5, 0.6, 0.3,  // 9: left forehead
    0.5, 0.6, 0.3,   // 10: right forehead
    
    // Ears
    -0.7, 1.3, 0,    // 11: left ear tip
    -0.5, 0.9, 0.1,  // 12: left ear base
    0.7, 1.3, 0,     // 13: right ear tip
    0.5, 0.9, 0.1,   // 14: right ear base
    
    // Back of head
    -0.8, 0.2, -0.3, // 15: left back
    0.8, 0.2, -0.3,  // 16: right back
    -0.6, 0.8, -0.2, // 17: left top back
    0.6, 0.8, -0.2,  // 18: right top back
    0, 0.9, -0.1,    // 19: top back center
    
    // Jaw/chin
    -0.4, -0.6, 0.5, // 20: left jaw
    0.4, -0.6, 0.5,  // 21: right jaw
    0, -0.7, 0.7,    // 22: chin point
  ]);
  
  // Define faces (triangles) using vertex indices
  const indices = new Uint16Array([
    // Snout
    0, 1, 3,
    0, 3, 2,
    1, 4, 3,
    2, 3, 5,
    
    // Cheeks to eyes
    1, 4, 6,
    2, 7, 5,
    4, 6, 9,
    5, 7, 10,
    
    // Eyes to forehead
    6, 9, 8,
    7, 8, 10,
    6, 7, 8,
    
    // Ears
    9, 12, 11,
    12, 9, 8,
    10, 13, 14,
    14, 8, 10,
    
    // Forehead to back
    9, 17, 19,
    10, 19, 18,
    8, 19, 9,
    8, 10, 19,
    
    // Sides to back
    4, 15, 9,
    5, 10, 16,
    9, 15, 17,
    10, 18, 16,
    
    // Back connections
    15, 17, 19,
    16, 19, 18,
    
    // Jaw
    0, 20, 1,
    0, 2, 21,
    0, 22, 20,
    0, 21, 22,
    1, 20, 4,
    2, 5, 21,
    
    // Lower connections
    4, 20, 15,
    5, 16, 21,
  ]);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  
  return geometry;
}

function WolfHead() {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const { mouse, viewport } = useThree();
  
  const geometry = useMemo(() => createWolfGeometry(), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 15), [geometry]);
  
  // Animate rotation and glow
  useFrame((state) => {
    if (meshRef.current && edgesRef.current) {
      // Gentle auto-rotation
      if (!clicked) {
        meshRef.current.rotation.y += 0.003;
        edgesRef.current.rotation.y += 0.003;
      }
      
      // Interactive rotation when clicked
      if (clicked) {
        const targetRotationY = (mouse.x * viewport.width) / viewport.width * Math.PI;
        const targetRotationX = -(mouse.y * viewport.height) / viewport.height * Math.PI * 0.3;
        
        meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.1;
        meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.1;
        edgesRef.current.rotation.copy(meshRef.current.rotation);
      }
      
      // Pulsing glow effect
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7;
      if (edgesRef.current.material instanceof THREE.LineBasicMaterial) {
        edgesRef.current.material.opacity = hovered || clicked ? 1 : pulse * 0.8;
      }
    }
  });
  
  return (
    <group>
      {/* Main mesh with gradient material */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={() => setClicked(true)}
        onPointerUp={() => setClicked(false)}
      >
        <meshPhongMaterial
          color={hovered || clicked ? '#a855f7' : '#06b6d4'}
          emissive={hovered || clicked ? '#ec4899' : '#0891b2'}
          emissiveIntensity={hovered || clicked ? 0.5 : 0.2}
          shininess={100}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Wireframe edges with glow */}
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial
          color={hovered || clicked ? '#ec4899' : '#06b6d4'}
          transparent
          opacity={0.8}
          linewidth={2}
        />
      </lineSegments>
    </group>
  );
}

export default function Interactive3DWolf() {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden">
      {/* Glowing backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
      
      {/* Instructions */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-4 py-2">
        <p className="text-xs text-cyan-400 font-mono">
          CLICK + DRAG TO INTERACT
        </p>
      </div>
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#06b6d4" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
        <spotLight
          position={[0, 5, 5]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          color="#ec4899"
        />
        
        {/* Wolf Head */}
        <WolfHead />
        
        {/* Orbit Controls for additional interaction */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
      
      {/* Scanline effect overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400/50 shadow-[0_0_10px_cyan] animate-scan-line" />
      </div>
    </div>
  );
}
