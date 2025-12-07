'use client';

/**
 * Sign-Up Page with Guest Wallet Migration
 *
 * Implements the "Endowment Effect" conversion flow:
 * 1. User arrives with ?intent=claim_guest_wallet
 * 2. Shows their pending portfolio value prominently
 * 3. After successful registration, automatically migrates their data
 * 4. Redirects to dashboard with success notification
 */

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';
import { useGuestStoreHydrated } from '@/stores/useGuestStore';

// ============================================================================
// TYPES
// ============================================================================

type RegistrationStep = 'form' | 'migrating' | 'success' | 'error';

interface FormData {
  email: string;
  password: string;
  name: string;
  birthDate: string;
}

// ============================================================================
// GUEST WALLET PREVIEW COMPONENT
// ============================================================================

function GuestWalletPreview({
  totalValue,
  cardCount,
}: {
  totalValue: number;
  cardCount: number;
}) {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
          <svg
            className="h-5 w-5 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm text-emerald-300">Your pending portfolio</p>
          <p className="text-xl font-bold text-emerald-400">{formattedValue}</p>
        </div>
        <span className="ml-auto rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Complete registration to secure this portfolio to your account.
      </p>
    </motion.div>
  );
}

// ============================================================================
// MIGRATION PROGRESS COMPONENT
// ============================================================================

function MigrationProgress({ cardCount }: { cardCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12"
    >
      {/* Animated Spinner */}
      <div className="relative mb-6">
        <motion.div
          className="h-16 w-16 rounded-full border-4 border-cyan-500/20"
          style={{ borderTopColor: '#00F0FF' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-cyan-400">{cardCount}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white">Securing Your Portfolio</h3>
      <p className="mt-2 text-sm text-slate-400">
        Migrating {cardCount} {cardCount === 1 ? 'card' : 'cards'} to your account...
      </p>
    </motion.div>
  );
}

// ============================================================================
// SUCCESS STATE
// ============================================================================

function SuccessState({ migratedCount }: { migratedCount: number }) {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to dashboard after 2 seconds
    const timeout = setTimeout(() => {
      router.push('/library');
    }, 2000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20"
      >
        <svg
          className="h-10 w-10 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.div>

      <h3 className="text-xl font-semibold text-white">Portfolio Secured!</h3>
      <p className="mt-2 text-sm text-slate-400">
        {migratedCount} {migratedCount === 1 ? 'card has' : 'cards have'} been added to your account.
      </p>
      <p className="mt-4 text-xs text-slate-500">Redirecting to your library...</p>
    </motion.div>
  );
}

// ============================================================================
// MAIN SIGN-UP FORM COMPONENT (with Suspense boundary)
// ============================================================================

function SignUpFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, user } = useAuth();
  const { cards, totalValue, isHydrated, clearStore } = useGuestStoreHydrated();

  const [step, setStep] = useState<RegistrationStep>('form');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    birthDate: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [migratedCount, setMigratedCount] = useState(0);

  // Check for guest wallet claim intent
  const intent = searchParams.get('intent');
  const isClaimingGuestWallet = intent === 'claim_guest_wallet';
  const hasGuestData = isHydrated && cards.length > 0;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/library');
    }
  }, [user, router]);

  /**
   * Migrate guest wallet data after successful registration
   */
  async function migrateGuestWallet(): Promise<number> {
    if (!hasGuestData) return 0;

    try {
      // Convert guest cards to migration payloads
      const payloads = cards.map((card) => ({
        cardId: card.tcgPlayerId,
        cardName: card.cardName,
        set: card.set,
        quantity: card.quantity,
        condition: card.condition,
        purchasePrice: card.purchasePrice,
        imageUrl: card.imageUrl,
      }));

      // Batch migrate to API
      const response = await fetch('/api/portfolio/batch-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloads }),
      });

      if (!response.ok) {
        throw new Error('Migration failed');
      }

      const result = await response.json();

      // Clear guest store on success
      clearStore();

      return result.summary?.total || cards.length;
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Register user
      await signUp(formData.email, formData.password, formData.name);

      // If claiming guest wallet, migrate data
      if (isClaimingGuestWallet && hasGuestData) {
        setStep('migrating');

        try {
          const count = await migrateGuestWallet();
          setMigratedCount(count);
          setStep('success');
        } catch (migrationError) {
          // Registration succeeded but migration failed
          // Still redirect, user can try again
          console.error('Migration failed after registration:', migrationError);
          router.push('/library?migration=failed');
        }
      } else {
        // No guest wallet to claim, redirect directly
        router.push('/library');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Handle input changes
   */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Don't render until hydrated
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-white">
              Apex <span className="text-cyan-400">Intelligence</span>
            </h1>
          </Link>
          <p className="mt-2 text-sm text-slate-400">
            {isClaimingGuestWallet && hasGuestData
              ? 'Secure your portfolio with a free account'
              : 'Create your free account'}
          </p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6 shadow-xl backdrop-blur"
        >
          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Guest Wallet Preview */}
                {isClaimingGuestWallet && hasGuestData && (
                  <GuestWalletPreview
                    totalValue={totalValue}
                    cardCount={cards.length}
                  />
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-300"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-apex mt-1 w-full"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-300"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input-apex mt-1 w-full"
                      placeholder="you@example.com"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-300"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="input-apex mt-1 w-full"
                      placeholder="Min. 8 characters"
                    />
                  </div>

                  {/* Birth Date (for COPPA compliance) */}
                  <div>
                    <label
                      htmlFor="birthDate"
                      className="block text-sm font-medium text-slate-300"
                    >
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      required
                      className="input-apex mt-1 w-full"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Required for age verification
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-300"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-apex-primary w-full disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating Account...
                      </span>
                    ) : isClaimingGuestWallet && hasGuestData ? (
                      'Create Account & Claim Portfolio'
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>

                {/* Sign In Link */}
                <p className="mt-6 text-center text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link
                    href="/sign-in"
                    className="text-cyan-400 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {step === 'migrating' && (
              <MigrationProgress cardCount={cards.length} />
            )}

            {step === 'success' && (
              <SuccessState migratedCount={migratedCount} />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-300">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-slate-300">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE EXPORT WITH SUSPENSE
// ============================================================================

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      }
    >
      <SignUpFormContent />
    </Suspense>
  );
}
