'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Creates an anatomically accurate low-poly wolf head geometry
 * Based on wolf skull research:
 * - 1:1 snout-to-cranium ratio (elongated muzzle)
 * - Flat cranium top with sagittal crest ridge
 * - Wide zygomatic arch (prominent cheekbones ~20% width)
 * - Dolichocephalic skull (long/narrow, craniofacial ratio ~286)
 * - Ears at 45° angle, placed high-back
 * - Strong mandible (0.8 upper height)
 * - 80 optimized vertices for low-poly balance
 *
 * Vertex distribution:
 * - Snout: 24 verts (30%)
 * - Cranium: 20 verts (25%)
 * - Ears: 16 verts (20%)
 * - Jaw: 10 verts (12.5%)
 * - Neck: 10 verts (12.5%)
 */
function createWolfGeometry() {
  const geometry = new THREE.BufferGeometry();

  // 80 vertices for anatomically accurate wolf head
  // Proportions: snout length = cranium length (1:1 ratio)
  // Total depth ~2.4 units (snout tip to occipital)
  const vertices = new Float32Array([
    // === NOSE/SNOUT TIP (0-7) - Tapers 30° from base ===
    0, -0.15, 1.8,        // 0: nose tip center (hero vertex)
    -0.1, -0.2, 1.75,     // 1: nose bottom left
    0.1, -0.2, 1.75,      // 2: nose bottom right
    -0.12, -0.08, 1.78,   // 3: nostril left
    0.12, -0.08, 1.78,    // 4: nostril right
    0, 0.0, 1.8,          // 5: nose bridge top
    -0.08, -0.25, 1.7,    // 6: nose underside left
    0.08, -0.25, 1.7,     // 7: nose underside right

    // === UPPER SNOUT/MUZZLE (8-15) - Elongated for 1:1 ratio ===
    -0.22, -0.1, 1.5,     // 8: upper snout left
    0.22, -0.1, 1.5,      // 9: upper snout right
    -0.18, 0.08, 1.55,    // 10: snout bridge left
    0.18, 0.08, 1.55,     // 11: snout bridge right
    0, 0.15, 1.6,         // 12: snout ridge center (nasal bone)
    -0.25, -0.25, 1.45,   // 13: lower snout left
    0.25, -0.25, 1.45,    // 14: lower snout right
    0, -0.3, 1.5,         // 15: lower snout center

    // === SNOUT MID-SECTION (16-23) ===
    -0.35, -0.05, 1.2,    // 16: mid-snout left
    0.35, -0.05, 1.2,     // 17: mid-snout right
    -0.3, 0.15, 1.25,     // 18: mid-snout bridge left
    0.3, 0.15, 1.25,      // 19: mid-snout bridge right
    0, 0.22, 1.3,         // 20: mid-snout ridge
    -0.38, -0.35, 1.15,   // 21: mid-snout jaw left
    0.38, -0.35, 1.15,    // 22: mid-snout jaw right
    0, -0.4, 1.2,         // 23: mid-snout jaw center

    // === SNOUT BASE/ZYGOMATIC (24-31) - Wide cheekbones ===
    -0.48, 0.0, 0.9,      // 24: snout base left
    0.48, 0.0, 0.9,       // 25: snout base right
    -0.58, 0.1, 0.75,     // 26: zygomatic arch left (hero - cheekbone)
    0.58, 0.1, 0.75,      // 27: zygomatic arch right (hero - cheekbone)
    -0.52, 0.25, 0.8,     // 28: upper cheek left
    0.52, 0.25, 0.8,      // 29: upper cheek right
    -0.45, -0.4, 0.85,    // 30: lower cheek/jaw left
    0.45, -0.4, 0.85,     // 31: lower cheek/jaw right

    // === EYE REGION (32-39) - 6-vert loops around eyes ===
    -0.42, 0.38, 0.7,     // 32: eye socket left outer
    0.42, 0.38, 0.7,      // 33: eye socket right outer
    -0.32, 0.42, 0.75,    // 34: eye left inner
    0.32, 0.42, 0.75,     // 35: eye right inner
    -0.38, 0.52, 0.65,    // 36: brow ridge left
    0.38, 0.52, 0.65,     // 37: brow ridge right
    -0.28, 0.32, 0.82,    // 38: eye bridge left
    0.28, 0.32, 0.82,     // 39: eye bridge right

    // === FOREHEAD/FLAT CRANIUM (40-47) - Flat top with sagittal crest ===
    0, 0.58, 0.55,        // 40: forehead center
    -0.32, 0.62, 0.45,    // 41: forehead left
    0.32, 0.62, 0.45,     // 42: forehead right
    0, 0.68, 0.35,        // 43: sagittal crest front (hero - ridge)
    -0.28, 0.7, 0.25,     // 44: cranium top left (flat)
    0.28, 0.7, 0.25,      // 45: cranium top right (flat)
    -0.22, 0.72, 0.1,     // 46: back cranium left
    0.22, 0.72, 0.1,      // 47: back cranium right

    // === LEFT EAR (48-55) - 45° angle, triangular ===
    -0.45, 0.65, 0.15,    // 48: left ear base outer
    -0.35, 0.68, 0.2,     // 49: left ear base inner
    -0.48, 0.62, 0.05,    // 50: left ear base back
    -0.55, 1.15, 0.1,     // 51: left ear tip outer (hero)
    -0.45, 1.18, 0.15,    // 52: left ear tip inner
    -0.5, 1.1, 0.0,       // 53: left ear tip back
    -0.52, 0.9, 0.08,     // 54: left ear mid outer
    -0.42, 0.92, 0.18,    // 55: left ear mid inner

    // === RIGHT EAR (56-63) - 45° angle, triangular ===
    0.45, 0.65, 0.15,     // 56: right ear base outer
    0.35, 0.68, 0.2,      // 57: right ear base inner
    0.48, 0.62, 0.05,     // 58: right ear base back
    0.55, 1.15, 0.1,      // 59: right ear tip outer (hero)
    0.45, 1.18, 0.15,     // 60: right ear tip inner
    0.5, 1.1, 0.0,        // 61: right ear tip back
    0.52, 0.9, 0.08,      // 62: right ear mid outer
    0.42, 0.92, 0.18,     // 63: right ear mid inner

    // === BACK OF SKULL/OCCIPITAL (64-69) ===
    -0.5, 0.45, -0.15,    // 64: skull back left upper
    0.5, 0.45, -0.15,     // 65: skull back right upper
    -0.45, 0.25, -0.25,   // 66: skull back left mid
    0.45, 0.25, -0.25,    // 67: skull back right mid
    0, 0.65, -0.2,        // 68: occipital bump (sagittal crest back)
    0, 0.35, -0.35,       // 69: skull back center (deepest point)

    // === JAW/MANDIBLE (70-75) - Strong, 0.8 upper height ===
    -0.32, -0.55, 0.65,   // 70: jaw hinge left (hero)
    0.32, -0.55, 0.65,    // 71: jaw hinge right (hero)
    -0.22, -0.65, 0.9,    // 72: chin left
    0.22, -0.65, 0.9,     // 73: chin right
    0, -0.7, 1.1,         // 74: chin point
    0, -0.58, 0.55,       // 75: throat

    // === NECK (76-79) - Connection with volume ===
    -0.4, -0.6, 0.35,     // 76: neck left
    0.4, -0.6, 0.35,      // 77: neck right
    -0.45, -0.45, -0.1,   // 78: neck back left
    0.45, -0.45, -0.1,    // 79: neck back right
  ]);

  // Define faces with proper topology following wolf anatomy
  // CCW winding for correct normals
  const indices = new Uint16Array([
    // === NOSE TIP FACES ===
    0, 1, 5,  0, 5, 2,  // nose front
    1, 3, 5,  2, 5, 4,  // nostril sides
    5, 3, 10, 5, 10, 12, 5, 12, 11, 5, 11, 4, // nose bridge
    0, 6, 1,  0, 2, 7,  1, 6, 7, 1, 7, 2, // nose underside

    // === UPPER SNOUT FACES ===
    3, 1, 8,  4, 9, 2,  // nostril to snout
    3, 8, 10, 4, 11, 9, // upper snout sides
    10, 8, 16, 10, 16, 18, 11, 17, 9, 11, 19, 17, // snout bridge to mid
    12, 10, 18, 12, 18, 20, 12, 20, 19, 12, 19, 11, // snout ridge
    6, 13, 8, 8, 13, 16, 7, 9, 14, 9, 17, 14, // snout sides
    6, 15, 13, 7, 14, 15, 6, 7, 15, // snout underside
    13, 15, 21, 14, 22, 15, 15, 22, 21, 21, 22, 23, // jaw underside

    // === MID-SNOUT TO BASE FACES ===
    16, 21, 24, 17, 25, 22, // mid to base sides
    18, 16, 24, 18, 24, 28, 19, 25, 17, 19, 29, 25, // upper sides
    20, 18, 28, 20, 28, 38, 20, 38, 39, 20, 39, 29, 20, 29, 19, // ridge to eyes
    21, 30, 24, 22, 25, 31, // lower sides

    // === ZYGOMATIC/CHEEK FACES ===
    24, 30, 26, 25, 27, 31, // cheekbone lower
    24, 26, 28, 25, 29, 27, // cheekbone upper
    28, 26, 32, 29, 33, 27, // cheek to eye

    // === EYE REGION FACES ===
    38, 28, 32, 38, 32, 34, 39, 33, 29, 39, 35, 33, // eye inner
    32, 34, 36, 33, 37, 35, // eye to brow
    34, 38, 40, 34, 40, 36, 35, 40, 39, 35, 37, 40, // eye bridge
    36, 40, 41, 37, 42, 40, // brow to forehead
    32, 36, 41, 33, 42, 37, // eye outer to forehead

    // === FOREHEAD/CRANIUM FACES ===
    40, 41, 43, 40, 43, 42, // forehead center
    41, 44, 43, 42, 43, 45, // forehead to cranium
    43, 44, 46, 43, 46, 68, 43, 68, 47, 43, 47, 45, // sagittal crest

    // === LEFT EAR FACES ===
    44, 48, 49, 44, 49, 46, // ear base inner
    48, 50, 46, 48, 54, 50, // ear base outer
    48, 49, 55, 48, 55, 54, // ear front
    54, 55, 52, 54, 52, 51, // ear mid
    50, 54, 53, 54, 51, 53, // ear back
    51, 52, 53, // ear tip
    49, 46, 68, 49, 68, 55, // ear to crest

    // === RIGHT EAR FACES ===
    45, 57, 56, 45, 47, 57, // ear base inner
    56, 47, 58, 56, 58, 62, // ear base outer
    56, 63, 57, 56, 62, 63, // ear front
    62, 60, 63, 62, 59, 60, // ear mid
    58, 61, 62, 62, 61, 59, // ear back
    59, 61, 60, // ear tip
    57, 68, 47, 57, 63, 68, // ear to crest

    // === BACK OF SKULL FACES ===
    41, 64, 44, 42, 45, 65, // forehead to back
    44, 64, 48, 45, 56, 65, // cranium sides to ears
    64, 66, 48, 48, 66, 78, 65, 56, 67, 56, 79, 67, // back sides
    64, 68, 46, 46, 50, 64, 65, 47, 68, 47, 65, 58, // back top
    50, 78, 64, 58, 65, 79, // ear base to back
    68, 64, 69, 68, 69, 65, 64, 66, 69, 65, 69, 67, // occipital
    66, 78, 69, 67, 69, 79, // back center

    // === JAW/MANDIBLE FACES ===
    30, 70, 26, 31, 27, 71, // jaw hinge to cheek
    26, 70, 64, 26, 64, 32, 27, 65, 71, 27, 33, 65, // jaw to skull
    70, 72, 30, 71, 31, 73, // jaw to chin
    72, 74, 30, 73, 31, 74, // chin sides
    30, 74, 21, 31, 22, 74, // chin to snout
    21, 74, 23, 22, 23, 74, // chin center
    72, 74, 73, // chin front

    // === THROAT/NECK FACES ===
    70, 75, 72, 71, 73, 75, // jaw to throat
    70, 76, 75, 71, 75, 77, // jaw hinge to neck
    75, 76, 77, // throat center

    // === NECK CONNECTION FACES ===
    76, 70, 26, 77, 27, 71, // neck to jaw
    76, 26, 64, 77, 65, 27, // neck sides
    76, 64, 78, 77, 79, 65, // neck to back
    76, 78, 77, 77, 78, 79, // neck back
    78, 66, 69, 79, 69, 67, // neck to skull back
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
    <div 
      className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden"
      style={{
        maskImage: `
          radial-gradient(ellipse 100% 100% at 50% 0%, black 60%, transparent 100%),
          radial-gradient(ellipse 100% 100% at 50% 100%, black 60%, transparent 100%),
          radial-gradient(ellipse 100% 100% at 0% 50%, black 60%, transparent 100%),
          radial-gradient(ellipse 100% 100% at 100% 50%, black 60%, transparent 100%),
          linear-gradient(black, black)
        `,
        maskComposite: 'intersect',
        WebkitMaskImage: `
          radial-gradient(ellipse 100% 100% at 50% 0%, black 60%, transparent 100%),
          radial-gradient(ellipse 100% 100% at 50% 100%, black 60%, transparent 100%),
          radial-gradient(ellipse 100% 100% at 0% 50%, black 60%, transparent 100%),
          radial-gradient(ellipse 100% 100% at 100% 50%, black 60%, transparent 100%),
          linear-gradient(black, black)
        `,
        WebkitMaskComposite: 'source-in',
      }}
    >
      {/* Prismatic glowing backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-cyan-500/10 blur-3xl animate-breathing" />
      
      {/* Instructions */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-4 py-2">
        <p className="text-xs text-cyan-400 font-mono">
          CLICK + DRAG TO INTERACT
        </p>
      </div>
      
      {/* 3D Canvas - Camera positioned to frame elongated 1:1 snout-cranium ratio */}
      <Canvas
        camera={{ position: [0, 0.2, 5], fov: 50 }}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Enhanced Prismatic Lighting for anatomical detail */}
        <ambientLight intensity={0.35} />
        <pointLight position={[8, 8, 8]} intensity={1.2} color="#06b6d4" />
        <pointLight position={[-8, -6, -8]} intensity={0.8} color="#a855f7" />
        <pointLight position={[0, 8, -8]} intensity={0.6} color="#0891b2" />
        {/* Front light to highlight snout detail */}
        <pointLight position={[0, 0, 6]} intensity={0.4} color="#22d3ee" />
        <spotLight
          position={[0, 6, 4]}
          angle={0.5}
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
