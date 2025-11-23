'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export const WolfConstellation = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wolf constellation nodes - positioned to match the actual logo shape
  const nodes = [
    // Outer constellation ring (24 nodes)
    ...Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * Math.PI * 2
      const radius = 240
      return {
        x: 250 + Math.cos(angle) * radius,
        y: 250 + Math.sin(angle) * radius,
        size: 3,
        color: i % 2 === 0 ? '#22d3ee' : '#a855f7',
        delay: i * 0.05
      }
    }),
    
    // Wolf head outline nodes
    // Ears
    { x: 200, y: 150, size: 4, color: '#22d3ee', delay: 1.2 },
    { x: 300, y: 150, size: 4, color: '#22d3ee', delay: 1.3 },
    
    // Top of head
    { x: 250, y: 130, size: 4, color: '#a855f7', delay: 1.4 },
    
    // Eyes
    { x: 220, y: 220, size: 5, color: '#22d3ee', delay: 1.5 },
    { x: 280, y: 220, size: 5, color: '#22d3ee', delay: 1.6 },
    
    // Snout
    { x: 250, y: 280, size: 4, color: '#a855f7', delay: 1.7 },
    { x: 230, y: 300, size: 3, color: '#22d3ee', delay: 1.8 },
    { x: 270, y: 300, size: 3, color: '#22d3ee', delay: 1.9 },
    
    // Jaw
    { x: 210, y: 320, size: 3, color: '#a855f7', delay: 2.0 },
    { x: 290, y: 320, size: 3, color: '#a855f7', delay: 2.1 },
    
    // Neck
    { x: 250, y: 350, size: 4, color: '#22d3ee', delay: 2.2 },
    
    // Side details
    { x: 180, y: 250, size: 3, color: '#a855f7', delay: 2.3 },
    { x: 320, y: 250, size: 3, color: '#a855f7', delay: 2.4 },
  ]

  // Connections between nodes to form the wolf shape
  const connections = [
    // Outer ring connections
    ...Array.from({ length: 24 }, (_, i) => ({
      from: i,
      to: (i + 1) % 24
    })),
    
    // Connect ring to wolf head
    { from: 0, to: 24 }, // top to ear
    { from: 6, to: 25 }, // right to ear
    { from: 12, to: 33 }, // bottom to neck
    { from: 18, to: 24 }, // left to ear
    
    // Wolf head structure
    { from: 24, to: 26 }, // left ear to top
    { from: 25, to: 26 }, // right ear to top
    { from: 24, to: 27 }, // left ear to left eye
    { from: 25, to: 28 }, // right ear to right eye
    { from: 27, to: 29 }, // left eye to snout
    { from: 28, to: 29 }, // right eye to snout
    { from: 29, to: 30 }, // snout to left mouth
    { from: 29, to: 31 }, // snout to right mouth
    { from: 30, to: 32 }, // left mouth to left jaw
    { from: 31, to: 33 }, // right mouth to right jaw
    { from: 32, to: 34 }, // left jaw to neck
    { from: 33, to: 34 }, // right jaw to neck
    { from: 27, to: 35 }, // left eye to left side
    { from: 28, to: 36 }, // right eye to right side
  ]

  if (!mounted) return null

  return (
    <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px]">
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.3))' }}
      >
        {/* Glow background */}
        <defs>
          <radialGradient id="glowGradient">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <circle
          cx="250"
          cy="250"
          r="240"
          fill="url(#glowGradient)"
          opacity="0.5"
        />

        {/* Connection lines */}
        {connections.map((conn, i) => {
          const fromNode = nodes[conn.from]
          const toNode = nodes[conn.to]
          
          return (
            <motion.line
              key={`line-${i}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={fromNode.color}
              strokeWidth="1"
              opacity="0.4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{
                duration: 0.5,
                delay: Math.max(fromNode.delay, toNode.delay) + 0.1,
                ease: "easeOut"
              }}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g key={`node-${i}`}>
            {/* Outer glow */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size * 2}
              fill={node.color}
              opacity="0.2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 2,
                delay: node.delay,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            {/* Inner node */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={node.color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.3,
                delay: node.delay,
                type: "spring",
                stiffness: 200
              }}
            />
          </motion.g>
        ))}
      </svg>
    </div>
  )
}
