import Link from 'next/link';
import {
  Download,
  Mail,
  Shield,
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  Clock,
  Award
} from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';

export const metadata = {
  title: "The AI Disruption Playbook | Apex Intelligence",
  description: "How Knowledge Workers Can Build Income That Survives 2030. A free 28-page guide to turning your expertise into assets before AI eats your job.",
  openGraph: {
    title: "The AI Disruption Playbook",
    description: "How Knowledge Workers Can Build Income That Survives 2030",
  },
};

const personas = [
  {
    icon: Users,
    name: "Freelancers",
    pain: "Rate pressure from AI-assisted competitors",
    solution: "Turn past projects into sellable playbooks",
    color: "cyan",
  },
  {
    icon: TrendingUp,
    name: "Curators",
    pain: "Hours of curation = $0 in direct income",
    solution: "Monetize your daily scrolling",
    color: "purple",
  },
  {
    icon: Target,
    name: "Analysts",
    pain: "Best work locked in private decks",
    solution: "Extract and sell anonymized intel",
    color: "orange",
  },
  {
    icon: BookOpen,
    name: "Educators",
    pain: "Free content builds reach but not income",
    solution: "Free tier for reputation, paid tier for income",
    color: "cyan",
  },
];

const sections = [
  {
    number: 1,
    title: "The Shift",
    description: "What '30-40% of tasks automated by 2030' actually means for your career",
    pages: "5-6 pages",
  },
  {
    number: 2,
    title: "New Game, New Rules",
    description: "Value inversion: why curation beats creation in the AI age",
    pages: "5-6 pages",
  },
  {
    number: 3,
    title: "Persona Playbooks",
    description: "Specific 90-day action plans for your situation",
    pages: "10-12 pages",
  },
  {
    number: 4,
    title: "One Execution Path",
    description: "How Apex Intelligence helps you build income that lasts",
    pages: "4-6 pages",
  },
];

export default function PlaybookPage() {
  return (
    <div className="relative min-h-screen pt-24 flex flex-col">
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-sans">
              <BookOpen className="w-4 h-4" />
              FREE 28-PAGE GUIDE
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-center mb-6">
            <span className="block text-white">The AI Disruption</span>
            <span className="block text-holographic">Playbook</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto text-center leading-relaxed font-sans mb-4">
            How Knowledge Workers Can Build Income That Survives 2030
          </p>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto text-center font-sans mb-12">
            By 2030, 30-40% of knowledge work tasks will be automated. This isn&apos;t about losing your job.
            It&apos;s about your income eroding piece by piece until you&apos;re competing with AI on price.
          </p>

          {/* Download Form */}
          <div className="max-w-md mx-auto">
            <HoloCard intensity="medium">
              <form className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-sans text-cyan-400 mb-2">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="you@example.com"
                      aria-label="Email address"
                      className="w-full rounded-lg bg-slate-900/80 pl-12 pr-4 py-4 text-white placeholder-slate-500 border border-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 px-6 py-4 font-bold text-white transition-all text-lg shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] font-sans flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Get the Free Playbook
                </button>

                <p className="text-center text-sm text-slate-500 font-sans">
                  <Shield className="inline w-4 h-4 mr-1" />
                  No spam. No sales calls. Just the playbook.
                </p>
              </form>
            </HoloCard>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-sans">
              <span className="text-purple-400">[</span> WHO THIS IS FOR <span className="text-purple-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((persona) => (
              <div
                key={persona.name}
                className={`border border-${persona.color}-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6`}
              >
                <div className={`w-12 h-12 rounded-full bg-${persona.color}-500/20 border border-${persona.color}-500/40 flex items-center justify-center mb-4`}>
                  <persona.icon className={`w-6 h-6 text-${persona.color}-400`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2 font-sans">{persona.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{persona.pain}</p>
                <p className="text-sm text-cyan-400">→ {persona.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Three Phases */}
      <section className="relative z-10 px-6 md:px-12 py-16 bg-slate-950/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4 font-sans">
            The Three Phases of AI Disruption
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            This isn&apos;t a prediction. It&apos;s a pattern we&apos;re already seeing in industry after industry.
          </p>

          <div className="space-y-6">
            <div className="relative border-l-4 border-cyan-500 pl-6 py-4">
              <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-sm font-bold text-black">1</div>
              <h3 className="text-xl font-bold text-white mb-2">Erosion (2024-2026)</h3>
              <p className="text-slate-400">AI handles routine tasks. You still feel secure. Clients ask you to &quot;polish&quot; AI drafts. The water&apos;s fine—maybe even easier.</p>
            </div>

            <div className="relative border-l-4 border-purple-500 pl-6 py-4">
              <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold text-black">2</div>
              <h3 className="text-xl font-bold text-white mb-2">Compression (2026-2028)</h3>
              <p className="text-slate-400">Rates compress. Volume drops. Your best clients start using AI directly. Something&apos;s wrong but you can&apos;t pinpoint it.</p>
            </div>

            <div className="relative border-l-4 border-orange-500 pl-6 py-4">
              <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-black">3</div>
              <h3 className="text-xl font-bold text-white mb-2">Collapse (2028-2030)</h3>
              <p className="text-slate-400">The old model breaks. Either you own assets or you&apos;re a commodity. No amount of skill saves you—only positioning does.</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-white font-sans mb-4">
              The playbook shows you how to build assets <em>before</em> Phase 3 hits.
            </p>
          </div>
        </div>
      </section>

      {/* What's Inside */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-sans">
              <span className="text-cyan-400">[</span> WHAT&apos;S INSIDE <span className="text-cyan-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <div
                key={section.number}
                className="border border-slate-700 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-sans shrink-0">
                    {section.number}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2 font-sans">{section.title}</h3>
                    <p className="text-sm text-slate-400 mb-2">{section.description}</p>
                    <p className="text-xs text-slate-500">{section.pages}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Value Inversion */}
      <section className="relative z-10 px-6 md:px-12 py-16 bg-slate-950/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4 font-sans">
            The Value Inversion
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            What&apos;s valuable is flipping. The playbook explains why and what to do about it.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-slate-700 bg-slate-900/50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-slate-400 mb-4">OLD WORLD</h3>
              <div className="space-y-2">
                <div className="text-slate-500">Research →</div>
                <div className="text-white font-bold text-xl">Generate ★</div>
                <div className="text-slate-500">→ Curate → Judge → Publish</div>
              </div>
              <p className="text-sm text-slate-500 mt-4">Creation was hard. Generators were valuable.</p>
            </div>

            <div className="border border-cyan-500/30 bg-slate-900/50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">NEW WORLD</h3>
              <div className="space-y-2">
                <div className="text-slate-500">Generate (AI) →</div>
                <div className="text-white font-bold text-xl">Curate → Judge ★ → Vouch ★</div>
                <div className="text-slate-500">→ Synthesize</div>
              </div>
              <p className="text-sm text-cyan-400 mt-4">Trust is scarce. Curators and judges are valuable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / What You'll Learn */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10 font-sans">
            After reading this playbook, you&apos;ll know:
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Why institutions (gov, corp, uni) won't save you",
              "The exact 3-phase pattern of AI disruption",
              "Why 'assets vs hours' is THE framework",
              "How reputation graphs replace CVs",
              "Your specific 90-day action plan",
              "How to turn past work into income",
              "The hybrid USD + reputation economy",
              "One concrete execution path (Apex)",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 md:px-12 py-20 bg-gradient-to-b from-slate-950/50 to-transparent">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4 font-sans">
            Get the Free Playbook
          </h2>
          <p className="text-slate-400 mb-8">
            28 pages. No fluff. Concrete action plans for your situation.
          </p>

          <HoloCard intensity="medium">
            <form className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  name="email-bottom"
                  required
                  placeholder="you@example.com"
                  aria-label="Email address"
                  className="w-full rounded-lg bg-slate-900/80 pl-12 pr-4 py-4 text-white placeholder-slate-500 border border-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 px-6 py-4 font-bold text-white transition-all text-lg font-sans flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download the Playbook
              </button>

              <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 15 min read
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4" /> Action-focused
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" /> 100% free
                </span>
              </div>
            </form>
          </HoloCard>
        </div>
      </section>

      {/* No Crypto Disclaimer */}
      <section className="relative z-10 px-6 md:px-12 py-8 text-center border-t border-slate-800">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-slate-500">
            <strong className="text-slate-400">Important:</strong> Apex Intelligence is not crypto.
            Our Reputation Credits (RC) cannot be traded, bought, or speculated on.
            You earn them through real contribution. You export your earnings in USD anytime.
          </p>
        </div>
      </section>

      {/* Back to Home */}
      <section className="relative z-10 px-6 md:px-12 py-12 text-center">
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
