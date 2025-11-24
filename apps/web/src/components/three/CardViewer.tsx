'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, PresentationControls, ContactShadows } from '@react-three/drei';
import { HolographicCard } from './HolographicCard';
import { Suspense } from 'react';

export const CardViewer = () => {
  return (
    <div className="relative w-full h-[500px] bg-gradient-to-b from-slate-900 to-black rounded-xl overflow-hidden border border-slate-800">

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-xs text-cyan-400 font-mono tracking-widest">LIVE PREVIEW // GL-CANVAS</span>
        </div>
        <h3 className="text-white font-bold text-xl mt-1">Charizard G-Spec</h3>
        <p className="text-slate-400 text-sm">Holographic // Mint Condition</p>
      </div>

      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }}>
        <fog attach="fog" args={['#000', 5, 15]} />

        <Suspense fallback={null}>
          <PresentationControls
            global
            config={{ mass: 2, tension: 500 }}
            snap={{ mass: 4, tension: 1500 }}
            rotation={[0, 0.3, 0]}
            polar={[-Math.PI / 3, Math.PI / 3]}
            azimuth={[-Math.PI / 1.4, Math.PI / 2]}
          >
            <HolographicCard imageUrl="/placeholder-card.jpg" />
          </PresentationControls>

          <Environment preset="city" />

          <ContactShadows
            position={[0, -2, 0]}
            opacity={0.5}
            scale={10}
            blur={2.5}
            far={4}
            color="#22d3ee"
          />
        </Suspense>
      </Canvas>

      {/* Interactive Hint */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <span className="text-xs text-slate-500 uppercase tracking-widest">Click & Drag to Inspect</span>
      </div>
    </div>
  );
};
