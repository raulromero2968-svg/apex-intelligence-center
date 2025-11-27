'use client';

import React, { useState } from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';

interface NewsletterSignupProps {
  variant?: 'inline' | 'modal' | 'sidebar';
  className?: string;
}

export function NewsletterSignup({ variant = 'inline', className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    // Simulate API call (replace with actual newsletter service)
    setTimeout(() => {
      setStatus('success');
      setMessage('Successfully subscribed! Check your inbox for confirmation.');
      setEmail('');

      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }, 1000);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'modal':
        return 'p-8 bg-gray-900/90 backdrop-blur-md rounded-2xl border border-cyan-500/30';
      case 'sidebar':
        return 'p-6 bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800';
      default:
        return 'p-6 bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800';
    }
  };

  return (
    <div className={`${getVariantStyles()} ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-cyan-900/20 rounded-lg">
          <Mail className="text-cyan-400" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-white font-orbitron">Underground Intel Drops</h3>
          <p className="text-xs text-gray-400">Weekly market analysis + exclusive insights</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="flex items-center gap-2 p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
          <Check className="text-green-400" size={20} />
          <p className="text-sm text-green-400">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={status === 'loading'}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Subscribing...' : 'Get Free Intel'}
          </button>

          {status === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
              <AlertCircle className="text-red-400" size={16} />
              <p className="text-xs text-red-400">{message}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            No spam. Unsubscribe anytime. We respect your inbox.
          </p>
        </form>
      )}
    </div>
  );
}
