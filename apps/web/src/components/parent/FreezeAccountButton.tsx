/**
 * Freeze Account Button - One-click account freeze/unfreeze (parent only)
 */

'use client';

import { useState } from 'react';
import { Snowflake, Unlock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface FreezeAccountButtonProps {
  childId: string;
  isFrozen: boolean;
  onUpdate: () => void;
}

export function FreezeAccountButton({ childId, isFrozen, onUpdate }: FreezeAccountButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFreeze = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/family/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          freeze: !isFrozen,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update freeze status');
      }

      toast.success(isFrozen ? 'Account unfrozen successfully' : 'Account frozen successfully');
      setShowModal(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update freeze status:', error);
      toast.error('Failed to update account status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
          isFrozen
            ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-400/50 text-green-300'
            : 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-300'
        }`}
      >
        {isFrozen ? (
          <>
            <Unlock className="h-5 w-5" />
            Unfreeze Account
          </>
        ) : (
          <>
            <Snowflake className="h-5 w-5" />
            Freeze Account
          </>
        )}
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-ink border border-cyan-500/20 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              {isFrozen ? (
                <Unlock className="h-8 w-8 text-green-400" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-blue-400" />
              )}
              <h2 className="text-2xl font-bold text-white">
                {isFrozen ? 'Unfreeze Account?' : 'Freeze Account?'}
              </h2>
            </div>

            {isFrozen ? (
              <div className="space-y-3 mb-6">
                <p className="text-slate-300">
                  This will restore full access to the child's account.
                </p>
                <p className="text-slate-400 text-sm">
                  The child will be able to:
                </p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 ml-2">
                  <li>View their portfolio</li>
                  <li>Manage watchlists</li>
                  <li>Receive alerts</li>
                  <li>Browse cards</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <p className="text-slate-300">
                  This will immediately freeze the child's account.
                </p>
                <p className="text-slate-400 text-sm">
                  The child will NOT be able to:
                </p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 ml-2">
                  <li>Access their portfolio</li>
                  <li>View or manage watchlists</li>
                  <li>Browse cards</li>
                  <li>Make any changes to their account</li>
                </ul>
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                  <p className="text-blue-300 text-sm font-semibold flex items-center gap-2">
                    <Snowflake className="h-4 w-4" />
                    Only you can unfreeze this account
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFreeze}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  isFrozen
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {loading ? 'Processing...' : isFrozen ? 'Unfreeze Now' : 'Freeze Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
