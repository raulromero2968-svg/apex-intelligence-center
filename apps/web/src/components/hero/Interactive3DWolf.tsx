'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Create a proper 3D low-poly wolf head with depth and volume
function createWolfGeometry() {
  const geometry = new THREE.BufferGeometry();
  
  // Define vertices for a FULL 3D wolf head (not just a mask)
  // Organized by sections: snout, face, skull, ears, jaw
  const vertices = new Float32Array([
    // === FRONT SNOUT (0-7) ===
    0, -0.4, 1.2,      // 0: snout bottom center
    -0.25, -0.3, 1.1,  // 1: snout bottom left
    0.25, -0.3, 1.1,   // 2: snout bottom right
    0, -0.1, 1.3,      // 3: snout tip top
    -0.3, -0.1, 1.0,   // 4: snout left side
    0.3, -0.1, 1.0,    // 5: snout right side
    -0.2, 0.1, 1.1,    // 6: snout bridge left
    0.2, 0.1, 1.1,     // 7: snout bridge right
    
    // === FACE/CHEEKS (8-15) ===
    -0.6, 0, 0.7,      // 8: left cheek outer
    0.6, 0, 0.7,       // 9: right cheek outer
    -0.5, 0.3, 0.8,    // 10: left eye socket
    0.5, 0.3, 0.8,     // 11: right eye socket
    -0.4, 0.4, 0.7,    // 12: left eye inner
    0.4, 0.4, 0.7,     // 13: right eye inner
    -0.3, 0.5, 0.6,    // 14: left brow
    0.3, 0.5, 0.6,     // 15: right brow
    
    // === FOREHEAD/TOP (16-21) ===
    0, 0.7, 0.5,       // 16: forehead center
    -0.4, 0.7, 0.4,    // 17: forehead left
    0.4, 0.7, 0.4,     // 18: forehead right
    0, 0.9, 0.3,       // 19: top of head center
    -0.3, 0.9, 0.2,    // 20: top of head left
    0.3, 0.9, 0.2,     // 21: top of head right
    
    // === EARS (22-29) ===
    -0.6, 0.9, 0.2,    // 22: left ear base outer
    -0.5, 0.9, 0.3,    // 23: left ear base inner
    -0.7, 1.4, 0.1,    // 24: left ear tip outer
    -0.6, 1.4, 0.2,    // 25: left ear tip inner
    0.6, 0.9, 0.2,     // 26: right ear base outer
    0.5, 0.9, 0.3,     // 27: right ear base inner
    0.7, 1.4, 0.1,     // 28: right ear tip outer
    0.6, 1.4, 0.2,     // 29: right ear tip inner
    
    // === BACK OF HEAD/SKULL (30-37) ===
    -0.7, 0.3, -0.2,   // 30: left side back
    0.7, 0.3, -0.2,    // 31: right side back
    -0.6, 0.6, -0.3,   // 32: left upper back
    0.6, 0.6, -0.3,    // 33: right upper back
    -0.4, 0.8, -0.4,   // 34: left top back
    0.4, 0.8, -0.4,    // 35: right top back
    0, 0.9, -0.3,      // 36: top back center
    0, 0.5, -0.5,      // 37: back center mid
    
    // === JAW/CHIN (38-43) ===
    -0.5, -0.5, 0.6,   // 38: left jaw
    0.5, -0.5, 0.6,    // 39: right jaw
    -0.3, -0.6, 0.8,   // 40: left chin
    0.3, -0.6, 0.8,    // 41: right chin
    0, -0.7, 0.9,      // 42: chin point
    0, -0.6, 0.5,      // 43: throat
    
    // === NECK CONNECTION (44-47) ===
    -0.4, -0.7, 0.3,   // 44: left neck
    0.4, -0.7, 0.3,    // 45: right neck
    -0.3, -0.8, 0,     // 46: left neck back
    0.3, -0.8, 0,      // 47: right neck back
  ]);
  
  // Define faces - creating proper 3D topology
  const indices = new Uint16Array([
    // SNOUT FRONT
    0, 1, 3,  0, 3, 2,  1, 4, 3,  2, 3, 5,
    3, 4, 6,  3, 6, 7,  3, 7, 5,
    
    // SNOUT TO FACE
    4, 8, 6,  5, 7, 9,  6, 10, 7,  7, 10, 11,
    7, 11, 9,  6, 8, 10,
    
    // FACE/EYES
    10, 8, 12,  11, 13, 9,  10, 12, 14,  11, 15, 13,
    12, 14, 16,  13, 16, 15,  14, 17, 16,  15, 16, 18,
    
    // FOREHEAD TO TOP
    16, 17, 19,  16, 19, 18,  17, 20, 19,  18, 19, 21,
    
    // EARS
    20, 22, 23,  20, 23, 19,  22, 24, 25,  22, 25, 23,
    21, 27, 26,  21, 19, 27,  26, 27, 29,  26, 29, 28,
    
    // SIDES TO BACK
    8, 30, 10,  9, 11, 31,  10, 30, 32,  11, 33, 31,
    10, 32, 17,  11, 18, 33,
    
    // BACK OF HEAD
    30, 37, 32,  31, 33, 37,  32, 37, 34,  33, 35, 37,
    32, 34, 20,  33, 21, 35,  34, 36, 20,  35, 21, 36,
    34, 35, 36,  20, 36, 19,  21, 19, 36,
    
    // JAW
    0, 38, 1,  0, 2, 39,  1, 38, 4,  2, 5, 39,
    38, 8, 4,  39, 5, 9,  0, 40, 38,  0, 39, 41,
    0, 42, 40,  0, 41, 42,
    
    // CHIN TO THROAT
    40, 43, 38,  41, 39, 43,  42, 43, 40,  42, 41, 43,
    
    // NECK
    38, 44, 8,  39, 9, 45,  43, 44, 38,  43, 39, 45,
    44, 46, 30,  45, 31, 47,  44, 30, 8,  45, 9, 31,
    44, 43, 46,  45, 47, 43,  46, 37, 30,  47, 31, 37,
    46, 43, 37,  47, 37, 43,
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
  
  // Animate rotation and prismatic glow
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
      
      // Pulsing prismatic glow effect
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
      if (edgesRef.current.material instanceof THREE.LineBasicMaterial) {
        edgesRef.current.material.opacity = hovered || clicked ? 1 : pulse * 0.9;
      }
      
      // Animate prismatic color shift
      if (meshRef.current.material instanceof THREE.MeshPhongMaterial) {
        const colorShift = (Math.sin(state.clock.elapsedTime) + 1) / 2;
        if (hovered || clicked) {
          // Shift between cyan and purple
          meshRef.current.material.color.setHex(
            colorShift > 0.5 ? 0x06b6d4 : 0xa855f7
          );
          meshRef.current.material.emissive.setHex(
            colorShift > 0.5 ? 0xa855f7 : 0x06b6d4
          );
        }
      }
    }
  });
  
  return (
    <group>
      {/* Main mesh with prismatic gradient material */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={() => setClicked(true)}
        onPointerUp={() => setClicked(false)}
      >
        <meshPhongMaterial
          color={hovered || clicked ? '#06b6d4' : '#0891b2'}
          emissive={hovered || clicked ? '#a855f7' : '#0e7490'}
          emissiveIntensity={hovered || clicked ? 0.6 : 0.3}
          shininess={100}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Wireframe edges with prismatic glow */}
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial
          color={hovered || clicked ? '#a855f7' : '#06b6d4'}
          transparent
          opacity={0.9}
          linewidth={2}
        />
      </lineSegments>
    </group>
  );
}

export default function Interactive3DWolf() {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden">
      {/* Prismatic glowing backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-cyan-500/10 blur-3xl animate-breathing" />
      
      {/* Instructions */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-4 py-2">
        <p className="text-xs text-cyan-400 font-mono">
          CLICK + DRAG TO INTERACT
        </p>
      </div>
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Prismatic Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
        <pointLight position={[-10, -10, -10]} intensity={0.7} color="#a855f7" />
        <pointLight position={[0, 10, -10]} intensity={0.5} color="#0891b2" />
        <spotLight
          position={[0, 5, 5]}
          angle={0.3}
          penumbra={1}
          intensity={1.2}
          color="#a855f7"
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
