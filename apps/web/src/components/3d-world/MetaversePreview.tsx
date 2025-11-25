'use client';

/**
 * Metaverse Preview - 3D world integration for Nexus dashboard
 *
 * Provides a preview of the TCG metaverse with:
 * - Animated 3D scene (CSS-based for performance)
 * - Live event indicators
 * - User presence display
 * - Quick access to full 3D world
 *
 * @see lib/3d-world/scene-manager for full implementation
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MetaverseEvent {
  id: string;
  name: string;
  type: 'tournament' | 'trade' | 'exhibition' | 'social';
  participants: number;
  startsAt: Date;
}

interface MetaversePreviewProps {
  userId: string;
  className?: string;
  onEnterWorld?: () => void;
}

export function MetaversePreview({
  userId,
  className,
  onEnterWorld,
}: MetaversePreviewProps) {
  const [events, setEvents] = useState<MetaverseEvent[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MetaverseEvent | null>(null);

  // Simulate live data
  useEffect(() => {
    // Mock events
    const mockEvents: MetaverseEvent[] = [
      {
        id: '1',
        name: 'Weekly TCG Championship',
        type: 'tournament',
        participants: 128,
        startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
      {
        id: '2',
        name: 'Rare Card Trading Hall',
        type: 'trade',
        participants: 45,
        startsAt: new Date(),
      },
      {
        id: '3',
        name: 'Quantum Cards Exhibition',
        type: 'exhibition',
        participants: 89,
        startsAt: new Date(),
      },
    ];

    setEvents(mockEvents);
    setOnlineUsers(Math.floor(Math.random() * 500) + 200);

    // Simulate user count updates
    const interval = setInterval(() => {
      setOnlineUsers((prev) => prev + Math.floor(Math.random() * 10) - 5);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return '🏆';
      case 'trade':
        return '🔄';
      case 'exhibition':
        return '🎨';
      case 'social':
        return '👥';
      default:
        return '🌐';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'trade':
        return 'border-green-500/50 bg-green-500/10';
      case 'exhibition':
        return 'border-purple-500/50 bg-purple-500/10';
      case 'social':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-cyan-500/30',
        'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated 3D Scene Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Grid floor effect */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            transform: isHovered ? 'perspective(500px) rotateX(60deg) translateY(-20%)' : 'perspective(500px) rotateX(60deg)',
            transition: 'transform 0.5s ease-out',
          }}
        />

        {/* Central portal effect */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              'w-32 h-32 rounded-full',
              'bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-cyan-500/30',
              'animate-spin',
              isHovered && 'scale-125'
            )}
            style={{
              animationDuration: '10s',
              transition: 'transform 0.5s ease-out',
            }}
          />
          <div
            className="absolute inset-4 rounded-full bg-gradient-to-r from-purple-600/50 to-cyan-600/50 animate-pulse"
            style={{ animationDuration: '2s' }}
          />
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🌐</span>
              TCG Metaverse
            </h3>
            <p className="text-sm text-gray-400">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
              {onlineUsers.toLocaleString()} collectors online
            </p>
          </div>

          <button
            onClick={onEnterWorld}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              'bg-gradient-to-r from-cyan-600 to-purple-600',
              'hover:from-cyan-500 hover:to-purple-500',
              'text-white shadow-lg shadow-cyan-500/25',
              isHovered && 'scale-105'
            )}
          >
            Enter World
          </button>
        </div>

        {/* Live Events */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Live Events
          </p>
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border cursor-pointer',
                'transition-all hover:scale-[1.02]',
                getEventColor(event.type),
                selectedEvent?.id === event.id && 'ring-2 ring-cyan-500'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getEventIcon(event.type)}</span>
                <div>
                  <p className="text-white font-medium text-sm">{event.name}</p>
                  <p className="text-gray-400 text-xs">
                    {event.participants} participants
                  </p>
                </div>
              </div>
              <div className="text-right">
                {event.startsAt <= new Date() ? (
                  <span className="text-green-400 text-xs font-medium">
                    LIVE NOW
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">
                    Starts in {Math.floor((event.startsAt.getTime() - Date.now()) / 60000)}m
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-2 bg-gray-800/50 rounded-lg">
            <p className="text-cyan-400 font-bold">156</p>
            <p className="text-gray-500 text-xs">Active Trades</p>
          </div>
          <div className="text-center p-2 bg-gray-800/50 rounded-lg">
            <p className="text-purple-400 font-bold">12</p>
            <p className="text-gray-500 text-xs">Tournaments</p>
          </div>
          <div className="text-center p-2 bg-gray-800/50 rounded-lg">
            <p className="text-green-400 font-bold">$45K</p>
            <p className="text-gray-500 text-xs">Daily Volume</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MetaversePreview;
