'use client';

import React from 'react';
import Link from 'next/link';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import {
  Zap,
  Play,
  Shield,
  Users,
  FileText,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Star,
  Vote,
  BookOpen,
  Briefcase,
  Compass,
  BarChart3,
  Globe,
  Lock,
  ChevronDown,
  Layers,
  Award
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const faqs = [
    {
      q: 'Is Apex just another AI content generator?',
      a: 'No. We use AI as a tool, but the product is you—your judgment, experience, and curation. Apex is about packaging that into reusable intelligence assets, not spitting out random blog posts.'
    },
    {
      q: 'Do I need to quit my job or freelancing to use this?',
      a: "No. Think of Apex as your parallel track: a way to turn your existing work into assets that could eventually replace or supplement your traditional income."
    },
    {
      q: 'What exactly are "intel cards"?',
      a: 'Structured, reusable chunks of intelligence—like reports, playbooks, checklists, benchmarks, or briefings—designed to help someone achieve a specific outcome faster.'
    },
    {
      q: 'Is RC a crypto token?',
      a: "No. RC isn't sold, traded, or listed on exchanges. You earn it by contributing value, and you use it inside Apex for visibility, access, and governance."
    },
    {
      q: 'What happens if Apex shuts down?',
      a: "Our goal is antifragility, not lock-in. You can export your intel and data, and our long-term roadmap includes open standards so your work isn't trapped."
    },
    {
      q: 'How early is this?',
      a: "We're in early access, working closely with a small group of freelancers, curators, analysts, and educators. If you get in now, you help shape the economy—and you benefit from being early in the RC graph."
    }
  ];

  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-cyan-500/30">
      <StarfieldBackground />
      <Navigation />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-900/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-mono mb-8">
            <Zap size={16} />
            ECONOMIC INFRASTRUCTURE FOR AI-DISPLACED WORKERS
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 font-orbitron leading-tight">
            Build your post-AI<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 glow-text-cyan">
              income now.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Turn your expertise and scrolling into tradable intelligence assets on a hybrid{' '}
            <span className="text-green-400 font-medium">USD</span> +{' '}
            <span className="text-purple-400 font-medium">Reputation Credits</span> economy designed for AI-displaced knowledge workers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-bold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/25 text-lg"
            >
              Get Early Access
              <ArrowRight size={20} />
            </Link>
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-700 text-white font-medium rounded-lg transition-all duration-300">
              <Play size={20} />
              Watch the 3-Minute Demo
            </button>
          </div>

          <p className="text-sm text-gray-500 font-mono">
            <Shield size={14} className="inline mr-2" />
            No crypto. No speculation. You own your work.
          </p>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="border-y border-gray-800 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <Users size={16} className="text-cyan-500" />
            Built for knowledge workers facing AI disruption
          </span>
          <span className="flex items-center gap-2">
            <Award size={16} className="text-purple-500" />
            Backed by operators in AI & future-of-work
          </span>
          <span className="flex items-center gap-2">
            <BookOpen size={16} className="text-pink-500" />
            Inspired by AI safety research
          </span>
        </div>
      </section>

      {/* WHY APEX EXISTS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-orbitron mb-4">
              The world is automating your job.
            </h2>
            <p className="text-xl text-cyan-400">
              It doesn't have to erase your income.
            </p>
          </div>

          <p className="text-lg text-gray-300 text-center max-w-3xl mx-auto mb-12">
            AI is getting good enough to do most tasks inside most jobs. Rates are dropping, leads are slowing, and platforms are quietly replacing human work with a prompt.
          </p>

          <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-8 mb-12">
            <p className="text-white font-medium text-lg mb-6 text-center">Apex exists so you can:</p>
            <ul className="space-y-4 max-w-2xl mx-auto">
              <li className="flex items-start gap-4">
                <CheckCircle className="text-cyan-400 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-300"><strong className="text-white">Stop selling only hours</strong></span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="text-cyan-400 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-300"><strong className="text-white">Start owning reusable intelligence assets</strong></span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="text-cyan-400 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-300"><strong className="text-white">Earn both cash and reputation</strong> in a system you help govern</span>
              </li>
            </ul>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-950/50 rounded-xl mb-4">
                <FileText className="text-cyan-400" size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-orbitron">Turn History Into Assets</h3>
              <p className="text-sm text-gray-400">
                Convert past projects, threads, and notes into structured intelligence.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-950/50 rounded-xl mb-4">
                <DollarSign className="text-green-400" size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-orbitron">Get Paid Twice</h3>
              <p className="text-sm text-gray-400">
                Earn <span className="text-green-400">USD</span> from buyers and <span className="text-purple-400">RC</span> from community reputation.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-950/50 rounded-xl mb-4">
                <Globe className="text-purple-400" size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-orbitron">Own Your Identity</h3>
              <p className="text-sm text-gray-400">
                Your Apex profile and RC history travel with you, beyond any single employer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-orbitron mb-4">
              From scrolling to sellable intel
            </h2>
            <p className="text-xl text-gray-400">in three steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-black font-bold text-xl">
                1
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 pt-10">
                <h3 className="text-lg font-bold text-white mb-3 font-orbitron">Connect</h3>
                <p className="text-gray-400 text-sm">
                  Link your existing work: Upwork projects, X/Twitter threads, documents, notes.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-black font-bold text-xl">
                2
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 pt-10">
                <h3 className="text-lg font-bold text-white mb-3 font-orbitron">Transform</h3>
                <p className="text-gray-400 text-sm">
                  Apex helps you turn that raw material into structured intel cards: reports, playbooks, briefings, benchmarks.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-xl">
                3
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 pt-10">
                <h3 className="text-lg font-bold text-white mb-3 font-orbitron">Earn</h3>
                <p className="text-gray-400 text-sm">
                  Publish to the Apex marketplace, earn USD from purchases and RC from upvotes, remixes, and community impact.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/intel" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              See example intel cards
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* THREE PLATFORMS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-orbitron mb-4">
              The Three Platforms
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-900/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Layers className="text-cyan-400" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white font-orbitron">Apex Omnis</h3>
              </div>
              <p className="text-cyan-400 text-sm mb-4 italic">Transform your past work into assets.</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-cyan-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Connect Upwork and other project sources</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-cyan-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Auto-extract briefs, deliverables, and outcomes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-cyan-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Approve and refine into reusable intel cards</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 border border-purple-900/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-purple-400" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white font-orbitron">Apex Intelligence</h3>
              </div>
              <p className="text-purple-400 text-sm mb-4 italic">Monetize your expertise.</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-purple-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Publish intel to a curated marketplace</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-purple-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Earn USD when people buy your reports and playbooks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-purple-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Earn RC as the community upvotes, cites, and remixes</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-pink-950/30 to-orange-950/30 border border-pink-900/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-pink-400" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white font-orbitron">Apex Commons</h3>
              </div>
              <p className="text-pink-400 text-sm mb-4 italic">Share knowledge, earn recognition.</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-pink-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Publish free resources to a shared public library</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-pink-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Help the ecosystem while building long-term reputation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-pink-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Use Commons reputation to boost your paid work</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-orbitron mb-4">
              Built for people who think for a living
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="text-cyan-400" size={24} />
                <h3 className="text-lg font-bold text-white">Freelancers</h3>
              </div>
              <p className="text-gray-400 text-sm italic mb-3">
                "Clients are testing AI and pushing my rates down."
              </p>
              <p className="text-gray-300 text-sm">
                Turn completed projects into evergreen assets that sell again and again.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Compass className="text-purple-400" size={24} />
                <h3 className="text-lg font-bold text-white">Curators</h3>
              </div>
              <p className="text-gray-400 text-sm italic mb-3">
                "I spend hours on X/Reddit/feeds with nothing to show for it."
              </p>
              <p className="text-gray-300 text-sm">
                Turn your scrolling and threads into structured intel reports.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="text-pink-400" size={24} />
                <h3 className="text-lg font-bold text-white">Analysts & Consultants</h3>
              </div>
              <p className="text-gray-400 text-sm italic mb-3">
                "My best work lives in PDFs and private decks."
              </p>
              <p className="text-gray-300 text-sm">
                Package your analyses as modular intel and earn beyond the retainer.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="text-yellow-400" size={24} />
                <h3 className="text-lg font-bold text-white">Educators & Builders</h3>
              </div>
              <p className="text-gray-400 text-sm italic mb-3">
                "I want to contribute to the commons without going broke."
              </p>
              <p className="text-gray-300 text-sm">
                Publish free resources to Commons, then layer premium intel on top.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HYBRID USD + RC EXPLAINER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-orbitron mb-4">
              Two currencies. One future.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-950/30 to-emerald-950/30 border border-green-900/50 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-green-400" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-orbitron">USD</h3>
                  <p className="text-green-400 text-sm">Pay the bills</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                You earn dollars when people buy your intel cards, subscriptions, or bundles. Withdraw to your bank like any other platform.
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Clear, transparent revenue share</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>No pay-to-win boosts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>You always own your underlying work</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-950/30 to-violet-950/30 border border-purple-900/50 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Star className="text-purple-400" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-orbitron">RC</h3>
                  <p className="text-purple-400 text-sm">Build your influence</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                RC is a non-tradable reputation currency you <strong className="text-white">earn</strong> by helping the network: publishing high-quality intel, curating, and contributing to Commons.
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-purple-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Cannot be bought or traded on exchanges</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-purple-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Increases when your work is consistently useful</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-purple-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Unlocks visibility, features, and governance rights</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8 font-mono">
            <Shield size={14} className="inline mr-2" />
            RC is designed to measure contribution, not fuel speculation.
          </p>
        </div>
      </section>

      {/* COMMUNITY & GOVERNANCE */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-orbitron mb-4">
              Not just a platform.
            </h2>
            <p className="text-xl text-cyan-400">An economy you help steer.</p>
          </div>

          <p className="text-lg text-gray-300 text-center max-w-3xl mx-auto mb-12">
            Apex is designed to outlive any single founder, company, or cloud provider. That means:
          </p>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-12">
            <ul className="space-y-4 max-w-2xl mx-auto">
              <li className="flex items-start gap-4">
                <Vote className="text-cyan-400 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-300">High-RC users can propose and vote on key changes</span>
              </li>
              <li className="flex items-start gap-4">
                <FileText className="text-cyan-400 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-300">Algorithms and fees are documented, not mysterious</span>
              </li>
              <li className="flex items-start gap-4">
                <Lock className="text-cyan-400 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-300">Your data and intel are portable—you're not trapped</span>
              </li>
            </ul>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 text-center">
              <FileText className="text-cyan-400 mx-auto mb-3" size={24} />
              <h4 className="font-bold text-white mb-1">Creators</h4>
              <p className="text-xs text-gray-400">Publish intel and earn</p>
            </div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 text-center">
              <Compass className="text-purple-400 mx-auto mb-3" size={24} />
              <h4 className="font-bold text-white mb-1">Curators</h4>
              <p className="text-xs text-gray-400">Upvote, review, and guide</p>
            </div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 text-center">
              <Shield className="text-pink-400 mx-auto mb-3" size={24} />
              <h4 className="font-bold text-white mb-1">Moderators</h4>
              <p className="text-xs text-gray-400">Keep the ecosystem healthy</p>
            </div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 text-center">
              <Vote className="text-yellow-400 mx-auto mb-3" size={24} />
              <h4 className="font-bold text-white mb-1">Governors</h4>
              <p className="text-xs text-gray-400">Steer with RC-weighted votes</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-orbitron mb-4">
              Pricing for people building their economic backup plan
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-2 font-orbitron">Starter</h3>
              <p className="text-3xl font-bold text-white mb-4">Free</p>
              <ul className="space-y-2 text-sm text-gray-300 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-gray-500 mt-0.5 flex-shrink-0" size={14} />
                  <span>Browse Commons</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-gray-500 mt-0.5 flex-shrink-0" size={14} />
                  <span>Create and publish limited intel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-gray-500 mt-0.5 flex-shrink-0" size={14} />
                  <span>Earn RC and first USD sales</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-500/50 rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-black text-xs font-bold rounded-full">
                POPULAR
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-orbitron">Creator</h3>
              <p className="text-3xl font-bold text-white mb-4">$50<span className="text-lg text-gray-400">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-300 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-cyan-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Advanced intel templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-cyan-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Higher marketplace visibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-cyan-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Priority support and creator community</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 border border-purple-900/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-2 font-orbitron">Pro / Platinum</h3>
              <p className="text-3xl font-bold text-white mb-4">$200+<span className="text-lg text-gray-400">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-300 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-purple-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Omnis integrations (Upwork, X, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-purple-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Deeper analytics and cohort tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-purple-400 mt-0.5 flex-shrink-0" size={14} />
                  <span>Higher revenue share and governance</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8 font-mono">
            We're in early access. Pricing and features may evolve as we learn with you.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-orbitron mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`text-gray-400 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-400 text-sm">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white font-orbitron mb-6 leading-tight">
            The AI wave is already here.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Build your lifeboat now.
            </span>
          </h2>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            If you think for a living, Apex is where you turn that thinking into assets that survive the next decade.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-bold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/25 text-lg"
            >
              Request Early Access
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/essay/automation-2030"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-700 text-white font-medium rounded-lg transition-all duration-300"
            >
              <FileText size={20} />
              Read the AI Disruption Essay
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img
              src="/images/apex-wolf-transparent.png"
              alt="Apex Intelligence"
              className="w-8 h-8 object-contain"
            />
            <span className="text-white font-bold font-orbitron">APEX_INTELLIGENCE</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/intel" className="hover:text-white transition-colors">Intel</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/essay/automation-2030" className="hover:text-white transition-colors">Essay</Link>
          </div>
          <p className="text-xs text-gray-600">
            &copy; 2025 Apex Intelligence. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
