'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface CardProps {
  imageUrl: string;
}

export const HolographicCard = ({ imageUrl }: CardProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Smooth rotation animation on hover
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Idle animation: slight breathing rotation
      if (!hovered) {
        meshRef.current.rotation.y += delta * 0.1;
      }
      // Interactive: move towards mouse position could be added here
    }
  });

  return (
    <Float
      speed={2} // Animation speed
      rotationIntensity={1} // Float rotation intensity
      floatIntensity={2} // Up/down float intensity
    >
      <mesh
        ref={meshRef}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        castShadow
        receiveShadow
      >
        {/* TCG Card Dimensions: 2.5 x 3.5 inches roughly translates to this aspect ratio */}
        <boxGeometry args={[2.5, 3.5, 0.05]} />

        {/* Edges/Back: Dark metallic look */}
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.2}
          metalness={0.8}
        />

        {/* Front Face: The Card Image */}
        {/* We use Decal or a separate material index for the face.
            For simplicity in this POC, we will use a texture loader on the front face index.
            In production, we would map the texture to specific UVs.
        */}
        <CardFace imageUrl={imageUrl} />
      </mesh>
    </Float>
  );
};

// Sub-component to handle texture loading safely
const CardFace = ({ imageUrl }: { imageUrl: string }) => {
    const texture = useTexture(imageUrl);
    
    return (
        <meshStandardMaterial 
            attach="material-4" 
            map={texture} 
            roughness={0.3}
            metalness={0.1}
        />
    );
}
