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
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error('Error loading Charizard texture:', error);
      }
    );
  }, [imageUrl]);

  // Smooth rotation animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      if (!hovered) {
        meshRef.current.rotation.y += delta * 0.1;
      }
    }
  });

  // Create materials array for box geometry faces
  // Box faces: [right, left, top, bottom, front, back]
  const materials = [
    // Right (index 0)
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.8 }),
    // Left (index 1)
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.8 }),
    // Top (index 2)
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.8 }),
    // Bottom (index 3)
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.8 }),
    // Front (index 4) - This is where we put the Charizard image
    new THREE.MeshStandardMaterial({ 
      map: texture, 
      roughness: 0.3, 
      metalness: 0.1 
    }),
    // Back (index 5)
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.8 }),
  ];

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
        material={materials}
      >
        <boxGeometry args={[2.5, 3.5, 0.05]} />
      </mesh>
    </Float>
  );
};
