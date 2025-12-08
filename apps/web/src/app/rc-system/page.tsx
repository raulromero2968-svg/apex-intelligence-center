import Link from 'next/link';
import {
  Coins,
  TrendingUp,
  Shield,
  Lock,
  Zap,
  Users,
  Award,
  Eye,
  Vote,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Scale,
  Gavel,
  Sparkles,
  Layers,
  BarChart3,
  MessageSquare,
  FileText,
  Flag,
} from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';

export const metadata = {
  title: "How Reputation Credits (RC) Work | Apex Intelligence",
  description: "Understand how you earn RC, what it unlocks, and why we built a reputation system that can't be bought or faked.",
  openGraph: {
    title: "How Reputation Credits Work",
    description: "Earn RC through genuine contribution. Unlock roles, visibility, and governance power.",
  },
};

const earnMethods = [
  {
    category: "Publishing Intel",
    icon: FileText,
    description: "When you publish an intel card that passes basic review, you earn RC for creating it. As other users upvote or save that intel, you earn additional RC (up to a sensible cap per card).",
    color: "cyan",
  },
  {
    category: "Contributing to Commons",
    icon: BookOpen,
    description: "When you publish high-quality free resources to Apex Commons, you earn extra RC. Commons is our public library; RC is how we recognize people who make it better.",
    color: "purple",
  },
  {
    category: "Helpful Commentary & Curation",
    icon: MessageSquare,
    description: "When you write comments that are marked as helpful or receive meaningful upvotes, you earn RC. Early curators who consistently surface great intel also earn RC as those intel cards perform well.",
    color: "cyan",
  },
  {
    category: "Governance & Stewardship",
    icon: Vote,
    description: "When you participate in governance (voting on proposals, serving on working groups) you can earn RC for showing up and helping steer the ecosystem. Report spam or abuse that mods confirm for a small RC reward.",
    color: "purple",
  },
];

const unlocks = [
  {
    title: "Creator Tools & Analytics",
    icon: BarChart3,
    description: "At certain RC thresholds, you unlock Creator+ dashboards: richer analytics, intel performance insights, better understanding of your buyers and readers.",
    threshold: "500 RC",
  },
  {
    title: "Visibility & Discovery",
    icon: Eye,
    description: "You can choose to stake RC to lightly boost an intel card for a short period. Boosts are always labeled and limited; they give you a nudge, not a free ride to the top.",
    threshold: "Any amount",
  },
  {
    title: "Ecosystem Roles",
    icon: Users,
    description: "With more RC, you become eligible for curator, moderator, or governor roles. Curators get better tools to organize and highlight great intel. Moderators help handle flags, spam, and abuse. Governors help make the big decisions.",
    threshold: "300-2,500 RC",
  },
  {
    title: "Governance Power",
    icon: Gavel,
    description: "RC gives you a voice in protocol decisions: proposing changes to fees and rules, approving or rejecting major roadmap shifts, shaping how the hybrid economy works.",
    threshold: "2,500+ RC",
  },
];

const contributorLevels = [
  { name: "Newcomer", threshold: 0, privileges: ["Basic publishing", "Standard marketplace access", "Comment and vote"] },
  { name: "Creator", threshold: 100, privileges: ["Verified creator badge", "Basic analytics access"] },
  { name: "Curator", threshold: 300, privileges: ["Create curated lists", "Featured section nominations", "Higher vote weight"] },
  { name: "Creator+", threshold: 500, privileges: ["Advanced analytics dashboard", "Revenue insights", "A/B testing for titles"] },
  { name: "Moderator", threshold: 1000, privileges: ["Content moderation tools", "Report review queue", "Light KYC required"] },
  { name: "Governor", threshold: 2500, privileges: ["Create high-impact proposals", "Weighted governance votes", "View moderation logs"] },
];

const faqs = [
  {
    question: "Can I buy or sell RC?",
    answer: "No. RC is earned, not bought. It's not a tradable token or investment product.",
  },
  {
    question: "Does RC turn into money?",
    answer: "RC itself does not convert to money. You earn USD when people buy your intel. RC measures your reputation and unlocks perks (visibility, roles, discounts, governance), not direct cash-out.",
  },
  {
    question: "What happens if I leave Apex?",
    answer: "You can export your intel and data. RC itself lives inside the Apex ecosystem, but we plan to support ways to prove your contribution history externally (for example, as a verifiable reputation record).",
  },
  {
    question: "Can Apex change how RC works?",
    answer: "Yes—but not secretly. Any big changes to RC rules will go through: a public proposal, community feedback, and governance approval once the community is large enough.",
  },
  {
    question: "What if someone abuses RC or tries to game the system?",
    answer: "We monitor for suspicious patterns, have daily caps, and give moderators tools to reverse fraudulent RC gains. Users who repeatedly abuse the system can lose RC and access.",
  },
];

export default function RCSystemPage() {
  return (
    <div className="relative min-h-screen pt-24 flex flex-col">
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative h-2 w-2 bg-cyan-500 rounded-full" />
              </span>
              REPUTATION ECONOMY
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-center mb-6">
            <span className="block text-white">How Reputation Credits</span>
            <span className="block text-holographic">(RC) Work</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto text-center leading-relaxed font-sans mb-4">
            Understand how you earn RC, what it unlocks, and why we built a reputation system that can&apos;t be bought or faked.
          </p>
        </div>
      </section>

      {/* Section 1: What is RC? */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-sans">
              <span className="text-cyan-400">[</span> 1. WHAT IS RC? <span className="text-cyan-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <Coins className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Reputation Credits (RC) are Apex&apos;s way of measuring <span className="text-cyan-400">long-term contribution and trust</span> in the ecosystem.
                </h3>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border-l-2 border-cyan-500/50 pl-4">
                <p className="text-slate-300 mb-2">
                  <strong className="text-white">You earn RC</strong> when your work helps other people: when they buy your intel, upvote it, save it, or learn from your Commons contributions.
                </p>
              </div>
              <div className="border-l-2 border-purple-500/50 pl-4">
                <p className="text-slate-300 mb-2">
                  <strong className="text-white">You use RC</strong> to unlock visibility, roles, and governance power inside Apex.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/50 rounded-lg p-6">
              <p className="text-slate-400 mb-4">Think of RC as a blend of:</p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <span className="text-white">StackOverflow reputation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-white">Frequent flyer status</span>
                </div>
                <div className="flex items-center gap-3">
                  <Vote className="w-5 h-5 text-cyan-400" />
                  <span className="text-white">Community voting power</span>
                </div>
              </div>
              <p className="text-slate-500 mt-4 text-sm">All rolled into one—designed for the post-AI economy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: What RC is NOT */}
      <section className="relative z-10 px-6 md:px-12 py-16 bg-slate-950/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-sans">
              <span className="text-purple-400">[</span> 2. WHAT RC IS NOT <span className="text-purple-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>

          <p className="text-slate-400 text-center mb-8">
            To keep things simple and sane:
          </p>

          <div className="space-y-4">
            <div className="border border-slate-700 bg-slate-900/50 rounded-lg p-6 flex items-start gap-4">
              <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold text-lg mb-2">RC is not a crypto token.</h3>
                <p className="text-slate-400">You can&apos;t buy it on an exchange, trade it, or speculate on its price.</p>
              </div>
            </div>

            <div className="border border-slate-700 bg-slate-900/50 rounded-lg p-6 flex items-start gap-4">
              <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold text-lg mb-2">RC is not a secret score we use behind your back.</h3>
                <p className="text-slate-400">You can always see how much you have and why it changed.</p>
              </div>
            </div>

            <div className="border border-slate-700 bg-slate-900/50 rounded-lg p-6 flex items-start gap-4">
              <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold text-lg mb-2">RC is not a pay-to-win boost system.</h3>
                <p className="text-slate-400">You can&apos;t swipe a credit card to dominate rankings.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-lg text-cyan-400 font-sans">
              RC is earned the hard way: by doing work that the community finds useful over time.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: How you earn RC */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-sans">
              <span className="text-cyan-400">[</span> 3. HOW YOU EARN RC <span className="text-cyan-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          <p className="text-slate-400 text-center mb-10">
            You earn RC by contributing to the Apex ecosystem. Here&apos;s the high-level picture:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {earnMethods.map((method, index) => (
              <div
                key={method.category}
                className={`border border-${method.color}-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full bg-${method.color}-500/20 border border-${method.color}-500/40 flex items-center justify-center`}>
                    <method.icon className={`w-5 h-5 text-${method.color}-400`} />
                  </div>
                  <div className={`text-${method.color}-400 font-bold text-sm`}>
                    {index + 1}. {method.category}
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {method.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 border border-amber-500/30 bg-amber-950/20 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-200 font-bold mb-1">Important:</p>
                <p className="text-amber-200/80 text-sm">
                  There are <strong>daily limits</strong> to how much RC you can earn from passive actions (like upvotes), so no one can farm infinite RC overnight.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: What RC unlocks */}
      <section className="relative z-10 px-6 md:px-12 py-16 bg-slate-950/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-sans">
              <span className="text-purple-400">[</span> 4. WHAT RC UNLOCKS <span className="text-purple-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>

          <p className="text-slate-400 text-center mb-10">
            RC is less about &quot;spending&quot; and more about <strong className="text-white">unlocking tiers of influence and access</strong>.
          </p>

          <div className="space-y-6">
            {unlocks.map((unlock, index) => (
              <div
                key={unlock.title}
                className="border border-slate-700 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                    <unlock.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-bold text-lg">
                        {index + 1}. {unlock.title}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 font-mono">
                        {unlock.threshold}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {unlock.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-lg text-slate-300">
              In short: RC is how we answer the question,{' '}
              <span className="text-cyan-400 italic">&quot;Who has consistently shown up and made this place better?&quot;</span>
            </p>
          </div>
        </div>
      </section>

      {/* Contributor Levels */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-sans">
              <span className="text-cyan-400">[</span> CONTRIBUTOR LEVELS <span className="text-cyan-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contributorLevels.map((level, index) => (
              <div
                key={level.name}
                className={`border ${index === contributorLevels.length - 1 ? 'border-purple-500/50 bg-purple-950/20' : 'border-slate-700 bg-slate-900/50'} rounded-lg p-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-bold ${index === contributorLevels.length - 1 ? 'text-purple-400' : 'text-white'}`}>
                    {level.name}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 font-mono">
                    {level.threshold.toLocaleString()} RC
                  </span>
                </div>
                <ul className="space-y-1">
                  {level.privileges.map((privilege) => (
                    <li key={privilege} className="text-sm text-slate-400 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-cyan-500" />
                      {privilege}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Fairness, Caps, and Anti-Abuse */}
      <section className="relative z-10 px-6 md:px-12 py-16 bg-slate-950/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-sans">
              <span className="text-cyan-400">[</span> 5. FAIRNESS, CAPS & ANTI-ABUSE <span className="text-cyan-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          <p className="text-slate-400 text-center mb-10">
            We take the reputation system seriously. To keep it fair:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-cyan-500/30 bg-slate-900/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-bold">Daily Caps</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                There is a <strong className="text-white">daily limit</strong> to how much RC you can earn from passive signals (like upvotes and saves).
              </p>
              <p className="text-slate-500 text-sm">
                This prevents spammy behavior and &quot;RC explosions&quot; from sudden brigades.
              </p>
            </div>

            <div className="border border-cyan-500/30 bg-slate-900/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-bold">Unique Voters Only</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                You only get RC from <strong className="text-white">unique users</strong> upvoting or saving your intel.
              </p>
              <p className="text-slate-500 text-sm">
                One person can&apos;t repeatedly click to inflate your score.
              </p>
            </div>

            <div className="border border-purple-500/30 bg-slate-900/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-bold">Moderation & Reversals</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                If an account is clearly gaming the system (fake accounts, coordinated spam), moderators can:
              </p>
              <ul className="text-slate-500 text-sm space-y-1">
                <li>• Freeze RC gains</li>
                <li>• Reverse illegitimate RC events</li>
              </ul>
              <p className="text-slate-500 text-sm mt-2">
                We log these actions for transparency and review.
              </p>
            </div>

            <div className="border border-purple-500/30 bg-slate-900/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-bold">No Hidden Rules</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                The main ways to earn and use RC are documented <strong className="text-white">on this page</strong>.
              </p>
              <p className="text-slate-500 text-sm">
                If we propose major changes to RC (earn rates, uses), they go through community discussion, a visible changelog, and governance approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Why RC Exists */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-sans">
              <span className="text-purple-400">[</span> 6. WHY RC EXISTS AT ALL <span className="text-purple-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>

          <HoloCard intensity="medium">
            <div className="text-center mb-8">
              <p className="text-xl text-slate-300 italic mb-6">
                &quot;In a world where AI can generate almost anything, <span className="text-cyan-400 font-bold">proof of long-term human contribution</span> is the real scarcity.&quot;
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-slate-400">RC exists because:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-slate-300">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                  Job titles and resumes are getting noisier and less meaningful
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                  Followers can be bought or wiped out by algorithm changes
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                  We need a way to say, <em>&quot;This person has been consistently useful here.&quot;</em>
                </li>
              </ul>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-white font-bold text-lg mb-4">RC is your economic identity inside Apex:</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">It follows your work, not your employer</p>
                </div>
                <div className="text-center">
                  <Layers className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">It accumulates over time as you help others</p>
                </div>
                <div className="text-center">
                  <Scale className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">It gives you real influence over the system</p>
                </div>
              </div>
            </div>
          </HoloCard>

          <p className="text-center text-lg text-slate-400 mt-8">
            Our goal is that, over years, your RC history becomes one of the most valuable parts of your online identity.
          </p>
        </div>
      </section>

      {/* Section 7: FAQ */}
      <section className="relative z-10 px-6 md:px-12 py-16 bg-slate-950/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-sans">
              <span className="text-cyan-400">[</span> 7. FAQ <span className="text-cyan-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="border border-slate-700 bg-slate-900/50 rounded-lg p-6"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-white font-bold mb-2">{faq.question}</h3>
                    <p className="text-slate-400 text-sm">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-slate-400 mb-8">
            If you still have questions about RC, or want to propose improvements to the system, join the community and ask—we want the people earning RC to help shape how it works.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-cyan-500/25"
            >
              <Zap className="w-5 h-5" />
              Join Early Access
            </Link>
            <Link
              href="/playbook"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 hover:border-cyan-500/50 text-slate-300 hover:text-white rounded-lg transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Read the Playbook
            </Link>
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <section className="relative z-10 px-6 md:px-12 py-12 text-center border-t border-slate-800">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 font-sans text-sm transition-colors"
        >
          <span>←</span> Back to Apex Intelligence
        </Link>
      </section>
    </div>
  );
}
