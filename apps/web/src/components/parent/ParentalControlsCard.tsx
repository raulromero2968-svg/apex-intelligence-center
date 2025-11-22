/**
 * Parental Controls Card - Toggle bedtime mode, cooldown, spending limits
 */

'use client';

import { useState } from 'react';
import { User } from '@/db/schema';
import { Moon, Zap, DollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ParentalControlsCardProps {
  childId: string;
  child: User;
  onUpdate: () => void;
}

export function ParentalControlsCard({ childId, child, onUpdate }: ParentalControlsCardProps) {
  const [bedtimeEnabled, setBedtimeEnabled] = useState(child.bedtimeEnabled ?? false);
  const [bedtimeStart, setBedtimeStart] = useState(child.bedtimeStart ?? '22:00');
  const [bedtimeEnd, setBedtimeEnd] = useState(child.bedtimeEnd ?? '07:00');
  const [cooldownEnabled, setCooldownEnabled] = useState(child.cooldownEnabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/family/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          bedtimeEnabled,
          bedtimeStart,
          bedtimeEnd,
          cooldownEnabled,
          spendingLimitCents: 0, // Always $0 for child accounts
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update controls');
      }

      toast.success('Parental controls updated successfully');
      onUpdate();
    } catch (error) {
      console.error('Failed to update controls:', error);
      toast.error('Failed to update parental controls');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-ink/95 border border-purple-500/20 rounded-lg p-6 backdrop-blur-xl hover:border-purple-500/50 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-6 w-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Parental Controls</h2>
      </div>

      <div className="space-y-6">
        {/* Bedtime Mode */}
        <div className="p-4 bg-slate-900/50 border border-purple-500/20 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Moon className="h-5 w-5 text-purple-400" />
            <h3 className="text-white font-semibold">Bedtime Mode</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Restrict account access during specific hours
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={bedtimeEnabled}
                onChange={(e) => setBedtimeEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 checked:bg-purple-500 focus:ring-2 focus:ring-purple-400"
              />
              <span className="text-white">Enable bedtime restrictions</span>
            </label>

            {bedtimeEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={bedtimeStart}
                    onChange={(e) => setBedtimeStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-purple-500/30 rounded text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={bedtimeEnd}
                    onChange={(e) => setBedtimeEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-purple-500/30 rounded text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cooldown Mode */}
        <div className="p-4 bg-slate-900/50 border border-cyan-500/20 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="h-5 w-5 text-cyan-400" />
            <h3 className="text-white font-semibold">60s Cooldown</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            60-second delay on "Buy" buttons after hype notifications
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cooldownEnabled}
              onChange={(e) => setCooldownEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-cyan-500/30 bg-slate-800 checked:bg-cyan-500 focus:ring-2 focus:ring-cyan-400"
            />
            <span className="text-white">Enable purchase cooldown</span>
          </label>
        </div>

        {/* Spending Limit */}
        <div className="p-4 bg-slate-900/50 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-5 w-5 text-green-400" />
            <h3 className="text-white font-semibold">Spending Limit</h3>
          </div>
          <p className="text-sm text-slate-400 mb-2">
            For child accounts, spending is always locked at:
          </p>
          <div className="text-3xl font-bold text-green-400">$0.00</div>
          <p className="text-xs text-slate-500 mt-2">
            Child accounts are portfolio tracking only - no purchases allowed
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 rounded-lg text-purple-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
