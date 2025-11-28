'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface CardProps {
  imageUrl: string;
}

export const HolographicCard = ({ imageUrl }: CardProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Load texture on client side
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        console.log('✅ Charizard texture loaded successfully!', loadedTexture);
        setTexture(loadedTexture);
      },
      (progress) => {
        console.log('Loading Charizard texture:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
      },
      (error) => {
        console.error('❌ Error loading Charizard texture:', error);
      }
    );
  }, [imageUrl]);

  // Smooth rotation animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      if (!hovered) {
        meshRef.current.rotation.y += delta * 0.2;
      }
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={1}
      floatIntensity={2}
    >
      <mesh
        ref={meshRef}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        castShadow
        receiveShadow
      >
        {/* Use plane geometry for simple texture display */}
        <planeGeometry args={[2.5, 3.5]} />
        
        <meshStandardMaterial 
          map={texture}
          side={THREE.DoubleSide}
          roughness={0.3}
          metalness={0.1}
          transparent={false}
        />
      </mesh>
    </Float>
  );
};
