/**
 * Session History Card - Display child's session activity
 */

'use client';

import { useState, useEffect } from 'react';
import { Clock, Monitor, Smartphone, Activity } from 'lucide-react';

interface Session {
  id: string;
  sessionStart: string;
  sessionEnd: string | null;
  durationMinutes: number | null;
  pagesViewed: number;
  cardsViewed: string[];
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    isMobile?: boolean;
  };
}

interface SessionHistoryCardProps {
  childId: string;
}

export function SessionHistoryCard({ childId }: SessionHistoryCardProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [childId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);

      // In production, this would fetch from /api/family/sessions?childId=[childId]
      // For now, using mock data
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Mock data
      const now = new Date();
      setSessions([
        {
          id: 's1',
          sessionStart: new Date(now.getTime() - 7200000).toISOString(),
          sessionEnd: new Date(now.getTime() - 3600000).toISOString(),
          durationMinutes: 60,
          pagesViewed: 25,
          cardsViewed: ['Charizard', 'Pikachu VMAX', 'Lugia EX'],
          deviceInfo: {
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
            platform: 'iOS',
            isMobile: true,
          },
        },
        {
          id: 's2',
          sessionStart: new Date(now.getTime() - 18000000).toISOString(),
          sessionEnd: new Date(now.getTime() - 14400000).toISOString(),
          durationMinutes: 60,
          pagesViewed: 42,
          cardsViewed: ['Umbreon VMAX', 'Rayquaza VMAX', 'Mewtwo V'],
          deviceInfo: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            platform: 'Windows',
            isMobile: false,
          },
        },
        {
          id: 's3',
          sessionStart: new Date(now.getTime() - 86400000).toISOString(),
          sessionEnd: new Date(now.getTime() - 82800000).toISOString(),
          durationMinutes: 60,
          pagesViewed: 18,
          cardsViewed: ['Charizard', 'Blastoise'],
          deviceInfo: {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            platform: 'macOS',
            isMobile: false,
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch session history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Less than 1 hour ago';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDeviceIcon = (deviceInfo?: Session['deviceInfo']) => {
    if (!deviceInfo) return <Monitor className="h-5 w-5" />;
    return deviceInfo.isMobile ? (
      <Smartphone className="h-5 w-5" />
    ) : (
      <Monitor className="h-5 w-5" />
    );
  };

  if (loading) {
    return (
      <div className="bg-ink/95 border border-green-500/20 rounded-lg p-6 backdrop-blur-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-green-500/20 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-24 bg-green-500/20 rounded"></div>
            <div className="h-24 bg-green-500/20 rounded"></div>
            <div className="h-24 bg-green-500/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ink/95 border border-green-500/20 rounded-lg p-6 backdrop-blur-xl hover:border-green-500/50 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6 text-green-400" />
        <h2 className="text-xl font-bold text-white">Session History</h2>
        <span className="ml-auto text-sm text-slate-400">Last {sessions.length} sessions</span>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No session history available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 bg-slate-900/50 border border-green-500/20 rounded-lg hover:border-green-500/40 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-green-400">{getDeviceIcon(session.deviceInfo)}</div>
                  <div>
                    <p className="text-white font-semibold">
                      {session.deviceInfo?.platform || 'Unknown Device'}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(session.sessionStart)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">
                    {session.durationMinutes ? `${session.durationMinutes}m` : 'Active'}
                  </p>
                  <p className="text-xs text-slate-400">{session.pagesViewed} pages</p>
                </div>
              </div>

              {/* Cards Viewed */}
              {session.cardsViewed.length > 0 && (
                <div className="pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Cards Viewed:</p>
                  <div className="flex flex-wrap gap-2">
                    {session.cardsViewed.slice(0, 5).map((card, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-300"
                      >
                        {card}
                      </span>
                    ))}
                    {session.cardsViewed.length > 5 && (
                      <span className="text-xs px-2 py-1 text-slate-400">
                        +{session.cardsViewed.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
