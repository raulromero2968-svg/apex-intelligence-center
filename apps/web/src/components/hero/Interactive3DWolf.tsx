'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Creates a proper low-poly wolf head geometry based on real wolf anatomy
 * Key features:
 * - Elongated snout (40% of head length)
 * - Defined jaw structure
 * - Proper cranium shape
 * - Triangular ears on top-back
 * - Full 3D volume with depth
 * - Tapered snout (wide at base, narrow at tip)
 */
function createWolfGeometry() {
  const geometry = new THREE.BufferGeometry();
  
  // 70 vertices for proper wolf head topology
  // Organized by anatomical sections with proper proportions
  const vertices = new Float32Array([
    // === NOSE/SNOUT TIP (0-5) ===
    0, -0.3, 1.5,        // 0: nose tip center
    -0.15, -0.35, 1.45,  // 1: nose bottom left
    0.15, -0.35, 1.45,   // 2: nose bottom right
    -0.2, -0.2, 1.4,     // 3: nostril left
    0.2, -0.2, 1.4,      // 4: nostril right
    0, -0.15, 1.5,       // 5: nose bridge top
    
    // === UPPER SNOUT/MUZZLE (6-13) ===
    -0.3, -0.25, 1.2,    // 6: upper snout left
    0.3, -0.25, 1.2,     // 7: upper snout right
    -0.25, -0.05, 1.25,  // 8: snout bridge left
    0.25, -0.05, 1.25,   // 9: snout bridge right
    0, 0.05, 1.3,        // 10: snout bridge center top
    -0.35, -0.4, 1.1,    // 11: lower snout left
    0.35, -0.4, 1.1,     // 12: lower snout right
    0, -0.45, 1.15,      // 13: lower snout center
    
    // === SNOUT BASE/CHEEKS (14-21) ===
    -0.45, -0.15, 0.9,   // 14: snout base left
    0.45, -0.15, 0.9,    // 15: snout base right
    -0.55, 0, 0.75,      // 16: cheek left outer
    0.55, 0, 0.75,       // 17: cheek right outer
    -0.5, 0.15, 0.8,     // 18: upper cheek left
    0.5, 0.15, 0.8,      // 19: upper cheek right
    -0.4, -0.5, 0.85,    // 20: lower jaw left
    0.4, -0.5, 0.85,     // 21: lower jaw right
    
    // === EYE REGION (22-29) ===
    -0.45, 0.3, 0.7,     // 22: eye socket left outer
    0.45, 0.3, 0.7,      // 23: eye socket right outer
    -0.35, 0.35, 0.75,   // 24: eye left inner
    0.35, 0.35, 0.75,    // 25: eye right inner
    -0.4, 0.45, 0.65,    // 26: brow left
    0.4, 0.45, 0.65,     // 27: brow right
    -0.3, 0.25, 0.8,     // 28: eye bridge left
    0.3, 0.25, 0.8,      // 29: eye bridge right
    
    // === FOREHEAD/CRANIUM TOP (30-37) ===
    0, 0.55, 0.6,        // 30: forehead center
    -0.35, 0.6, 0.5,     // 31: forehead left
    0.35, 0.6, 0.5,      // 32: forehead right
    0, 0.75, 0.4,        // 33: top of cranium center
    -0.3, 0.8, 0.3,      // 34: cranium top left
    0.3, 0.8, 0.3,       // 35: cranium top right
    -0.25, 0.85, 0.15,   // 36: back cranium left
    0.25, 0.85, 0.15,    // 37: back cranium right
    
    // === EARS (38-45) ===
    -0.5, 0.7, 0.25,     // 38: left ear base outer
    -0.4, 0.75, 0.3,     // 39: left ear base inner
    -0.6, 1.2, 0.2,      // 40: left ear tip outer
    -0.5, 1.25, 0.25,    // 41: left ear tip inner
    0.5, 0.7, 0.25,      // 42: right ear base outer
    0.4, 0.75, 0.3,      // 43: right ear base inner
    0.6, 1.2, 0.2,       // 44: right ear tip outer
    0.5, 1.25, 0.25,     // 45: right ear tip inner
    
    // === BACK OF SKULL (46-53) ===
    -0.6, 0.5, -0.1,     // 46: skull back left upper
    0.6, 0.5, -0.1,      // 47: skull back right upper
    -0.55, 0.3, -0.2,    // 48: skull back left mid
    0.55, 0.3, -0.2,     // 49: skull back right mid
    -0.45, 0.65, -0.25,  // 50: skull back left top
    0.45, 0.65, -0.25,   // 51: skull back right top
    0, 0.75, -0.2,       // 52: skull back center top
    0, 0.4, -0.3,        // 53: skull back center mid
    
    // === JAW/CHIN (54-59) ===
    -0.35, -0.6, 0.7,    // 54: jaw left
    0.35, -0.6, 0.7,     // 55: jaw right
    -0.25, -0.7, 0.9,    // 56: chin left
    0.25, -0.7, 0.9,     // 57: chin right
    0, -0.75, 1.0,       // 58: chin point
    0, -0.65, 0.6,       // 59: throat
    
    // === NECK CONNECTION (60-69) ===
    -0.45, -0.7, 0.4,    // 60: neck left upper
    0.45, -0.7, 0.4,     // 61: neck right upper
    -0.4, -0.8, 0.2,     // 62: neck left mid
    0.4, -0.8, 0.2,      // 63: neck right mid
    -0.35, -0.85, 0,     // 64: neck left lower
    0.35, -0.85, 0,      // 65: neck right lower
    0, -0.75, 0.3,       // 66: neck center upper
    0, -0.85, 0.1,       // 67: neck center mid
    -0.5, -0.5, -0.15,   // 68: neck back left
    0.5, -0.5, -0.15,    // 69: neck back right
  ]);
  
  // Define faces with proper topology following wolf anatomy
  const indices = new Uint16Array([
    // NOSE TIP
    0, 1, 5,  0, 5, 2,  1, 3, 5,  2, 5, 4,
    3, 1, 6,  4, 7, 2,  5, 3, 8,  5, 8, 10,  5, 10, 9,  5, 9, 4,
    
    // UPPER SNOUT
    3, 6, 8,  4, 9, 7,  8, 6, 14,  9, 15, 7,
    10, 8, 28,  10, 28, 29,  10, 29, 9,
    6, 11, 14,  7, 15, 12,  11, 13, 14,  12, 14, 13,
    1, 11, 6,  2, 7, 12,  1, 13, 11,  2, 12, 13,  0, 13, 1,  0, 2, 13,
    
    // SNOUT BASE TO FACE
    14, 16, 18,  15, 19, 17,  14, 18, 28,  15, 29, 19,
    28, 18, 22,  29, 23, 19,  28, 22, 24,  29, 25, 23,
    11, 20, 14,  12, 15, 21,  20, 16, 14,  21, 15, 17,
    
    // EYE REGION
    22, 24, 26,  23, 27, 25,  24, 22, 18,  25, 19, 23,
    24, 30, 26,  25, 27, 30,  26, 30, 31,  27, 32, 30,
    22, 26, 31,  23, 32, 27,
    
    // FOREHEAD TO CRANIUM
    30, 31, 33,  30, 33, 32,  31, 34, 33,  32, 33, 35,
    33, 34, 36,  33, 36, 52,  33, 52, 37,  33, 37, 35,
    
    // EARS
    34, 38, 39,  34, 39, 36,  38, 40, 41,  38, 41, 39,
    40, 41, 45,  40, 45, 44,  39, 41, 36,  41, 52, 36,
    35, 43, 42,  35, 37, 43,  42, 43, 45,  42, 45, 44,
    43, 37, 52,  43, 52, 45,
    
    // BACK OF SKULL
    31, 46, 34,  32, 35, 47,  34, 46, 38,  35, 42, 47,
    46, 48, 38,  47, 42, 49,  38, 48, 68,  42, 69, 49,
    46, 50, 36,  47, 37, 51,  50, 52, 36,  51, 37, 52,
    50, 52, 51,  46, 50, 48,  47, 49, 51,
    48, 53, 68,  49, 69, 53,  50, 53, 48,  51, 49, 53,  50, 51, 53,
    
    // JAW
    20, 54, 16,  21, 17, 55,  16, 54, 48,  17, 49, 55,
    54, 56, 20,  55, 21, 57,  56, 58, 20,  57, 21, 58,
    56, 58, 57,  20, 58, 11,  21, 12, 58,  11, 58, 13,  12, 13, 58,
    
    // THROAT/NECK CONNECTION
    54, 59, 56,  55, 57, 59,  54, 60, 59,  55, 59, 61,
    59, 60, 66,  59, 66, 61,  60, 62, 66,  61, 66, 63,
    62, 64, 66,  63, 66, 65,  64, 67, 66,  65, 66, 67,
    
    // NECK TO SKULL
    60, 54, 16,  61, 17, 55,  60, 16, 48,  61, 49, 17,
    60, 48, 68,  61, 69, 49,  60, 68, 62,  61, 63, 69,
    62, 68, 64,  63, 65, 69,  68, 53, 64,  69, 65, 53,
    64, 53, 67,  65, 67, 53,
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
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 0.85;
      if (edgesRef.current.material instanceof THREE.LineBasicMaterial) {
        edgesRef.current.material.opacity = (hovered || clicked) ? 1 : pulse * 0.9;
      }
      
      // Animate prismatic color shift between cyan and purple
      if (meshRef.current.material instanceof THREE.MeshPhongMaterial) {
        const colorShift = (Math.sin(state.clock.elapsedTime * 0.8) + 1) / 2;
        if (hovered || clicked) {
          // Smooth transition between cyan and purple
          const r = 0.024 + (0.659 - 0.024) * colorShift; // 06 -> a8
          const g = 0.714 - (0.714 - 0.333) * colorShift; // b6 -> 55
          const b = 0.831 + (0.969 - 0.831) * colorShift; // d4 -> f7
          meshRef.current.material.color.setRGB(r, g, b);
          
          // Inverse for emissive
          const er = 0.659 - (0.659 - 0.024) * colorShift;
          const eg = 0.333 + (0.714 - 0.333) * colorShift;
          const eb = 0.969 - (0.969 - 0.831) * colorShift;
          meshRef.current.material.emissive.setRGB(er, eg, eb);
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
          emissiveIntensity={hovered || clicked ? 0.5 : 0.25}
          shininess={100}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Wireframe edges with prismatic glow */}
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial
          color={hovered || clicked ? '#a855f7' : '#06b6d4'}
          transparent
          opacity={0.95}
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
        camera={{ position: [0, 0, 4], fov: 45 }}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Prismatic Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#06b6d4" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#a855f7" />
        <pointLight position={[0, 10, -10]} intensity={0.6} color="#0891b2" />
        <spotLight
          position={[0, 8, 5]}
          angle={0.4}
          penumbra={1}
          intensity={1}
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
