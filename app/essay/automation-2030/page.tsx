import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import {
  Brain,
  TrendingDown,
  AlertTriangle,
  Target,
  Shield,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  FileText,
  Building2,
  Layers
} from 'lucide-react';

export const metadata: Metadata = {
  title: '99% of Jobs Automated by 2030 - What That Actually Means',
  description: 'A deep analysis of AI automation for knowledge workers: what "99% automation" really means, how it affects your career, and practical moves to build economic resilience.',
  keywords: ['AI automation', 'future of work', 'knowledge workers', 'freelancers', 'AI disruption', 'career planning', 'economic resilience'],
  openGraph: {
    title: '99% of Jobs Automated by 2030 - What That Actually Means',
    description: 'A deep analysis of AI automation for knowledge workers and practical moves to build economic resilience.',
    type: 'article',
  },
};

export default function AutomationEssayPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-cyan-500/30">
      <StarfieldBackground />
      <Navigation />

      <article className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center space-x-2 text-cyan-500 mb-4 font-mono text-sm tracking-wider">
            <Brain size={16} />
            <span>FLAGSHIP ESSAY</span>
            <span>//</span>
            <span>AI & FUTURE OF WORK</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-orbitron text-white mb-6 leading-tight glow-text-cyan">
            99% of Jobs Automated by 2030 &mdash; Here's What That Actually Means
          </h1>
          <div className="flex items-center justify-between text-sm text-gray-400 font-mono">
            <span>AUTHOR: APEX INTELLIGENCE</span>
            <span>DECEMBER 2025</span>
          </div>
        </header>

        {/* TL;DR */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-cyan-900/50 rounded-xl p-6 mb-12">
          <h2 className="text-lg font-bold text-cyan-400 mb-4 font-orbitron flex items-center gap-2">
            <Zap size={18} />
            TL;DR
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <ArrowRight className="text-cyan-400 mt-1 flex-shrink-0" size={16} />
              <span className="text-gray-300">
                AI is on track to automate a huge chunk of knowledge-work tasks by 2030—some estimates put <strong className="text-white">30–40% of jobs or work hours</strong> in highly automatable categories.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <ArrowRight className="text-cyan-400 mt-1 flex-shrink-0" size={16} />
              <span className="text-gray-300">
                The real risk isn't "no jobs"—it's <strong className="text-white">rapid erosion of how we earn money today</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <ArrowRight className="text-cyan-400 mt-1 flex-shrink-0" size={16} />
              <span className="text-gray-300">
                What survives are <strong className="text-white">assets, reputation graphs, and communities</strong>—not hourly labor.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <ArrowRight className="text-cyan-400 mt-1 flex-shrink-0" size={16} />
              <span className="text-gray-300">
                You should start turning your past work and daily curation into reusable intelligence assets <strong className="text-white">now</strong>—Apex is one way to do that.
              </span>
            </li>
          </ul>
        </div>

        {/* INTRO */}
        <div className="mb-12">
          <p className="text-lg text-gray-300 mb-6 leading-relaxed">
            You've probably seen the headline version:
          </p>
          <blockquote className="border-l-4 border-cyan-500 pl-6 py-2 mb-6 bg-cyan-950/10">
            <p className="text-xl text-white italic font-medium">
              "99% of jobs will be automated by 2030."
            </p>
          </blockquote>
          <p className="text-gray-300 mb-4">
            It sounds like either clickbait or apocalypse. So most people do the only psychologically tolerable thing: they shrug, bookmark it, and go back to work.
          </p>
          <p className="text-gray-300 mb-4">
            The problem is, you <em className="text-white">can</em> ignore timelines and percentages.
            You <em className="text-white">can't</em> ignore the direction of travel.
          </p>
          <p className="text-gray-300">
            This essay is about what "99% automation" actually means for you if you're a freelancer, analyst, creator, consultant, or any other knowledge worker—and what you can do now so you're not economically naked when the tide goes out.
          </p>
        </div>

        {/* SECTION 1 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6 flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-lg">01</span>
            "99% of Jobs Automated" ≠ 99% of Humans Useless
          </h2>

          <p className="text-gray-300 mb-6">First, some precision.</p>

          <p className="text-gray-300 mb-4">
            When people say "99% of jobs will be automated," they usually mean:
          </p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <CheckCircle className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
              <span><strong className="text-white">Most of the tasks inside most jobs can be done by AI</strong> cheaper and faster than humans</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
              <span><strong className="text-white">At a quality level that's "good enough"</strong> for most organizations</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
              <span><strong className="text-white">Within a time window</strong> (say 2025–2035) that's short compared to a typical career</span>
            </li>
          </ul>

          <p className="text-gray-300 mb-4">That does <em className="text-white">not</em> mean:</p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <XCircle className="text-red-400 mt-1 flex-shrink-0" size={18} />
              <span>99% of humans have nothing useful to offer, or</span>
            </li>
            <li className="flex items-start gap-3">
              <XCircle className="text-red-400 mt-1 flex-shrink-0" size={18} />
              <span>There will only be 1% of jobs left and everyone else starves</span>
            </li>
          </ul>

          <p className="text-gray-300 mb-4">It means:</p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <ArrowRight className="text-purple-400 mt-1 flex-shrink-0" size={18} />
              <span>The structure of work changes faster than institutions can adapt</span>
            </li>
            <li className="flex items-start gap-3">
              <ArrowRight className="text-purple-400 mt-1 flex-shrink-0" size={18} />
              <span>The market for "I'll do this task for you" collapses in thousands of places at once</span>
            </li>
            <li className="flex items-start gap-3">
              <ArrowRight className="text-purple-400 mt-1 flex-shrink-0" size={18} />
              <span>The premium shifts from "I can do X" to <strong className="text-white">"I can define the problem, choose the tools, and own the outcome"</strong></span>
            </li>
          </ul>

          <div className="bg-gradient-to-br from-red-950/30 to-orange-950/30 border border-red-900/50 rounded-xl p-6 mb-6">
            <p className="text-white font-medium">
              The danger isn't that humans become useless.<br />
              The danger is that our current <strong className="text-cyan-400">economic plumbing</strong> is not built for this speed of change.
            </p>
          </div>

          {/* Data Citation Box */}
          <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-4 text-sm">
            <p className="text-gray-400 mb-2 font-mono text-xs">SOURCES & CONTEXT</p>
            <ul className="space-y-2 text-gray-400">
              <li>
                • Recent analyses suggest <span className="text-white">up to 30% of hours worked</span> today could be automated by 2030, forcing about <span className="text-white">14% of the global workforce</span> to change occupations. — <span className="text-cyan-400/80">TIAA Institute, 2025</span>
              </li>
              <li>
                • Some estimates put <span className="text-white">40% of US jobs</span> in highly automatable categories by 2030. — <span className="text-cyan-400/80">McKinsey Global Institute, 2025</span>
              </li>
              <li>
                • The same reports stress that <span className="text-white">skills and human judgment stay central</span>—work just gets restructured, not eliminated. — <span className="text-cyan-400/80">McKinsey & Company</span>
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 2 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6 flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-lg">02</span>
            Jobs Are Bundles of Tasks – AI Eats the Bundle from the Inside
          </h2>

          <p className="text-gray-300 mb-6">
            Most jobs are bundles of tasks stitched together with meetings.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="text-cyan-400" size={18} />
                Take a Copywriter
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Research the client</li>
                <li>• Research the audience</li>
                <li>• Outline ideas</li>
                <li>• Draft copy</li>
                <li>• Edit copy</li>
                <li>• A/B test</li>
                <li>• Send invoices</li>
                <li>• Manage relationships</li>
              </ul>
              <p className="text-xs text-cyan-400 mt-4 font-mono">
                AI is already competent at 4–5 of those, and rapidly getting better at the rest.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Building2 className="text-purple-400" size={18} />
                Take a Consultant
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Gather data</li>
                <li>• Build slide decks</li>
                <li>• Synthesize interviews</li>
                <li>• Model scenarios</li>
                <li>• Present recommendations</li>
                <li>• Manage politics</li>
              </ul>
              <p className="text-xs text-purple-400 mt-4 font-mono">
                Same story.
              </p>
            </div>
          </div>

          <p className="text-gray-300 mb-4">
            When AI automates 80–90% of the <em>tasks</em> inside a job, organizations do not lovingly preserve the old job description. They:
          </p>

          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-3">
              <TrendingDown className="text-red-400 mt-1 flex-shrink-0" size={18} />
              <span>Reduce headcount</span>
            </li>
            <li className="flex items-start gap-3">
              <TrendingDown className="text-red-400 mt-1 flex-shrink-0" size={18} />
              <span>Re-scope roles around oversight and politics</span>
            </li>
            <li className="flex items-start gap-3">
              <TrendingDown className="text-red-400 mt-1 flex-shrink-0" size={18} />
              <span>Squeeze rates for anyone still selling time</span>
            </li>
          </ul>

          <div className="bg-gray-900/30 border-l-4 border-yellow-500 p-5 rounded-lg">
            <p className="text-white">
              This is what "99% automation" feels like on the ground:<br />
              Not one big layoff event, but <strong className="text-yellow-400">a thousand little erosions</strong> that make your income shakier every year.
            </p>
          </div>
        </section>

        {/* SECTION 3 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6 flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-lg">03</span>
            How This Actually Feels: Erosion → Compression → Collapse
          </h2>

          <p className="text-gray-300 mb-8">
            If you're a knowledge worker, the next 5–10 years will tend to follow three phases.
          </p>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-950/30 to-transparent border border-green-900/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-3 font-orbitron">
                Phase 1: Erosion <span className="text-gray-500 font-normal text-sm">(you can pretend nothing's wrong)</span>
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• A few clients ghost you because they're "trying out AI"</li>
                <li>• New leads expect you to be cheaper and faster "because you're using ChatGPT now, right?"</li>
                <li>• Inside companies, promotions quietly slow down for roles that look automatable</li>
              </ul>
              <p className="text-sm text-green-400 mt-4 italic">
                On paper you're fine. Emotionally, you start to feel... replaceable.
              </p>
            </div>

            <div className="bg-gradient-to-r from-yellow-950/30 to-transparent border border-yellow-900/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-3 font-orbitron">
                Phase 2: Compression <span className="text-gray-500 font-normal text-sm">(you work harder for the same or less)</span>
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• The going rate for your service drops, globally</li>
                <li>• Marketplaces fill with people undercutting each other using AI</li>
                <li>• You're asked to manage more projects, more clients, more output—with fewer colleagues</li>
              </ul>
              <p className="text-sm text-yellow-400 mt-4 italic">
                You feel busier than ever, but your economic leverage is shrinking.
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-950/30 to-transparent border border-red-900/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-3 font-orbitron">
                Phase 3: Collapse <span className="text-gray-500 font-normal text-sm">(the old way stops working)</span>
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• That one big client decides their "AI + one in-house generalist" stack is good enough</li>
                <li>• The job posting you would have applied for last year simply doesn't exist</li>
                <li>• The platforms you relied on change terms or tilt their algorithms toward AI-generated outputs</li>
              </ul>
              <p className="text-sm text-red-400 mt-4 italic">
                This is where people say, "No one told me this was coming," despite shouting matches on X and YouTube for a decade.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6 flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-lg">04</span>
            The Value Inversion: From Generation to Curation
          </h2>

          <p className="text-gray-300 mb-6">For most of the internet era, value looked like this:</p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <h4 className="font-bold text-white mb-2">Scarce:</h4>
              <p className="text-gray-300 text-sm">Distribution, publishing tools, expertise</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <h4 className="font-bold text-white mb-2">Abundant:</h4>
              <p className="text-gray-300 text-sm">Audience attention (sort of), opportunity</p>
            </div>
          </div>

          <p className="text-gray-300 mb-6">
            So you got rewarded for <strong className="text-white">being able to produce</strong>: content, code, analysis, designs.
          </p>

          <p className="text-lg text-cyan-400 font-medium mb-6">AI inverts that.</p>

          <p className="text-gray-300 mb-6">
            Soon—in many niches already—anyone can:
          </p>

          <ul className="space-y-2 mb-8 text-gray-300">
            <li>• Generate competent blog posts, landing pages, sales emails</li>
            <li>• Mock up designs, prototypes, marketing plans</li>
            <li>• Summarize books, papers, entire websites</li>
          </ul>

          <div className="bg-gradient-to-br from-cyan-950/30 to-purple-950/30 border border-cyan-900/50 rounded-xl p-6 mb-6">
            <p className="text-white font-medium mb-4">
              When this is the baseline, raw generation stops being a differentiator.
            </p>
            <p className="text-gray-300 mb-4">What becomes scarce:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Target className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
                <span><strong className="text-white">Curation:</strong> Deciding what matters among infinite options</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
                <span><strong className="text-white">Judgment:</strong> Saying "this is good enough, that is dangerous, this is noise"</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
                <span><strong className="text-white">Lived experience & pattern recognition:</strong> Spotting subtle signals from years in a field</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
                <span><strong className="text-white">Trust:</strong> A track record of being directionally right, honest, and useful</span>
              </li>
            </ul>
          </div>

          <p className="text-gray-300 mb-4">
            The internet is already a firehose. AI turns it into a pressure washer aimed at your face.
          </p>

          <p className="text-lg text-white font-medium">
            The winners are the people who become <span className="text-cyan-400">filters and framers</span>, not just fountains.
          </p>
        </section>

        {/* SECTION 5 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6 flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-lg">05</span>
            Institutions Will Not Catch You
          </h2>

          <p className="text-gray-300 mb-6">If you assume:</p>

          <ul className="space-y-2 mb-6 text-gray-300">
            <li>• Governments will regulate this neatly,</li>
            <li>• Universities will retrain you in time,</li>
            <li>• Big platforms will protect you,</li>
          </ul>

          <p className="text-gray-300 mb-6">
            ...you're betting your life on institutions that are already underwater.
          </p>

          <p className="text-gray-300 mb-6">
            Not because they're evil (though incentives are messy), but because they:
          </p>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-400 mt-1 flex-shrink-0" size={18} />
                <span>Move on decade timelines, not 2–5 year timelines</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-400 mt-1 flex-shrink-0" size={18} />
                <span>Are optimized for stability, not rapid restructuring</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-400 mt-1 flex-shrink-0" size={18} />
                <span>Answer to voters, donors, shareholders—not directly to you</span>
              </li>
            </ul>
          </div>

          <p className="text-gray-300 mb-6">
            By the time a government program exists to "help AI-displaced workers," the best opportunities will already be <strong className="text-white">owned by people who started adapting years earlier</strong>.
          </p>

          <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 border border-purple-900/50 rounded-xl p-6">
            <p className="text-white">
              You don't have to be paranoid. You do have to be realistic.
            </p>
            <p className="text-gray-300 mt-3">
              No one is coming to save your individual career.<br />
              But <em className="text-cyan-400">you</em> can absolutely build something that survives the storm.
            </p>
          </div>
        </section>

        {/* SECTION 6 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6 flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-lg">06</span>
            So What Actually Survives?
          </h2>

          <p className="text-gray-300 mb-8">
            If 99% of jobs are at least partially automated, what's left? Here's what tends to endure and even thrive:
          </p>

          <div className="space-y-6">
            <div className="bg-gray-900/30 border-l-4 border-cyan-500 p-5 rounded-lg">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <Layers className="text-cyan-400" size={18} />
                1. Ownership of Reusable Assets
              </h4>
              <p className="text-gray-300 text-sm">
                Not "I did this once," but "I own the playbook / dataset / framework that can be used 1,000 times."
              </p>
            </div>

            <div className="bg-gray-900/30 border-l-4 border-purple-500 p-5 rounded-lg">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <Users className="text-purple-400" size={18} />
                2. Systems That People Opt Into
              </h4>
              <p className="text-gray-300 text-sm">
                Communities, platforms, and protocols that are useful enough people choose to live there.
              </p>
            </div>

            <div className="bg-gray-900/30 border-l-4 border-pink-500 p-5 rounded-lg">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <Zap className="text-pink-400" size={18} />
                3. Reputation Graphs
              </h4>
              <p className="text-gray-300 text-sm mb-2">
                Not a CV, but a history of:
              </p>
              <ul className="text-sm text-gray-400 ml-4 space-y-1">
                <li>• "Who trusted you?"</li>
                <li>• "Whose work did you endorse?"</li>
                <li>• "When were you early and right?"</li>
              </ul>
            </div>

            <div className="bg-gray-900/30 border-l-4 border-yellow-500 p-5 rounded-lg">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="text-yellow-400" size={18} />
                4. Work Anchored in Accountability and Context
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Negotiating trade-offs with stakeholders</li>
                <li>• Bearing responsibility for outcomes, not outputs</li>
                <li>• Navigating culture, regulation, and human emotion</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-900/50 rounded-xl p-6 mt-8">
            <p className="text-white font-medium">
              AI can do a lot. It struggles with <span className="text-cyan-400">owning consequences, earning trust, and living through the mess</span>.
            </p>
            <p className="text-gray-300 mt-3">
              You can.<br />
              The question is: how do you turn that into an economy?
            </p>
          </div>
        </section>

        {/* SECTION 7 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6 flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-lg">07</span>
            Practical Moves for the Next 3–5 Years
          </h2>

          <p className="text-gray-300 mb-8">
            Let's bring this down from theory. Here are concrete moves you can start making now, regardless of whether you use any specific product.
          </p>

          <div className="space-y-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-4 font-orbitron">
                1. Stop Selling Only Hours
              </h3>
              <p className="text-gray-300 mb-4">
                You may still sell time to pay bills. But start asking:
              </p>
              <ul className="space-y-2 text-gray-300 mb-4">
                <li className="flex items-start gap-3">
                  <ArrowRight className="text-cyan-400 mt-1 flex-shrink-0" size={16} />
                  <span>"What can I create once that pays me multiple times?"</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="text-cyan-400 mt-1 flex-shrink-0" size={16} />
                  <span>"What knowledge do I have that is reusable across clients or companies?"</span>
                </li>
              </ul>
              <p className="text-gray-300 mb-2">That could be:</p>
              <div className="flex flex-wrap gap-2">
                {['Playbooks', 'Reports', 'Templates', 'Benchmarks', 'Niche data collections', 'Annotated research'].map((item) => (
                  <span key={item} className="px-3 py-1 bg-cyan-950/30 border border-cyan-900/50 rounded-full text-sm text-cyan-400">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-sm text-white mt-4 italic">
                Think of yourself less as a service provider and more as a <span className="text-cyan-400">creator of intelligence assets</span>.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-purple-400 mb-4 font-orbitron">
                2. Turn Your Digital Exhaust into a Portfolio
              </h3>
              <p className="text-gray-300 mb-4">
                You already do unpaid work:
              </p>
              <ul className="space-y-1 text-gray-300 mb-4 text-sm">
                <li>• X threads and replies</li>
                <li>• Slack or Discord explanations</li>
                <li>• Client Loom recordings</li>
                <li>• Notion docs, Google Docs, email breakdowns</li>
              </ul>
              <p className="text-gray-300 mb-4">
                Start capturing and organizing that into:
              </p>
              <ul className="space-y-1 text-gray-300 mb-4 text-sm">
                <li>• Collections of insights on specific topics</li>
                <li>• "Here's how I think about X in 2025–2030" documents</li>
                <li>• Case studies, even if anonymized</li>
              </ul>
              <div className="bg-purple-950/20 border border-purple-900/50 rounded-lg p-4">
                <p className="text-sm text-white italic">
                  If you disappeared tomorrow, could someone look at your digital footprint and say, "This person clearly saw patterns most people missed"?
                </p>
                <p className="text-sm text-purple-400 mt-2">
                  If the answer is no, this is the cheapest, highest-ROI place to start.
                </p>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-pink-400 mb-4 font-orbitron">
                3. Build Reputation Outside a Single Employer or Platform
              </h3>
              <p className="text-gray-300 mb-4">You need:</p>
              <ul className="space-y-2 text-gray-300 mb-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-pink-400 mt-1 flex-shrink-0" size={16} />
                  <span>Somewhere your best thinking lives under <em className="text-white">your</em> name</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-pink-400 mt-1 flex-shrink-0" size={16} />
                  <span>Somewhere that can't be rug-pulled by a single CEO decision</span>
                </li>
              </ul>
              <p className="text-gray-300 mb-2">This might be:</p>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• A personal site</li>
                <li>• A newsletter</li>
                <li>• A community you actively participate in</li>
                <li>• A platform that stores a history of your contributions and their impact</li>
              </ul>
              <p className="text-sm text-white mt-4 italic">
                In a world of deepfakes and AI spam, <span className="text-pink-400">verifiable history</span> is gold.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-4 font-orbitron">
                4. Reduce Single Points of Failure
              </h3>
              <p className="text-gray-300 mb-4">Audit your career risk:</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {['One employer?', 'One platform for leads?', 'One geography?', 'One narrow skill?'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-gray-300">
                    <AlertTriangle className="text-yellow-400 flex-shrink-0" size={14} />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-300">
                You don't need zero dependence, but you want <strong className="text-white">multiple paths to income</strong> and at least one path where you own the audience and the assets.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 8 - APEX */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6 flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-lg">08</span>
            One Example of a Lifeboat: Apex Intelligence
          </h2>

          <p className="text-gray-300 mb-6">
            There are many ways to execute the principles above. I'm building one of them.
          </p>

          <p className="text-gray-300 mb-8">
            Apex Intelligence is designed as <strong className="text-white">economic infrastructure for AI-displaced knowledge workers</strong>. In practice, that means:
          </p>

          <div className="space-y-6 mb-8">
            <div className="bg-gradient-to-r from-cyan-950/30 to-transparent border border-cyan-900/50 rounded-xl p-6">
              <h4 className="font-bold text-white mb-3">
                1. We help you turn your past work and daily scrolling into intelligence assets.
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Connect your Upwork, your X threads, your documents</li>
                <li>• Use AI to transform the raw material into structured reports, playbooks, and briefings</li>
                <li>• You refine and own the final assets</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-purple-950/30 to-transparent border border-purple-900/50 rounded-xl p-6">
              <h4 className="font-bold text-white mb-3">
                2. You sell those assets in a marketplace that pays in USD and Reputation Credits (RC).
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• <strong className="text-green-400">USD</strong> is money in your bank</li>
                <li>• <strong className="text-purple-400">RC</strong> is a non-speculative reputation currency you earn by being consistently useful</li>
                <li>• RC unlocks visibility, governance, and deeper access in the ecosystem</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-pink-950/30 to-transparent border border-pink-900/50 rounded-xl p-6">
              <h4 className="font-bold text-white mb-3">
                3. You contribute to a public library (Commons) to build long-term reputation.
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• You can publish free versions or excerpts of your work</li>
                <li>• The community can benefit even if they can't pay</li>
                <li>• Your RC and influence grow based on how much you help</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-300 mb-4">In other words:</p>

          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-3 text-gray-300">
              <CheckCircle className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
              <span>Your <strong className="text-white">past projects</strong> stop gathering dust</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300">
              <CheckCircle className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
              <span>Your <strong className="text-white">X scrolling</strong> stops being free labor for someone else's platform</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300">
              <CheckCircle className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
              <span>Your <strong className="text-white">reputation</strong> becomes a durable, portable asset, not just a follower count</span>
            </li>
          </ul>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-white font-medium italic">
              If Apex disappeared tomorrow, your assets and reputation history should come with you. That's the bar we're aiming for.
            </p>
          </div>
        </section>

        {/* SECTION 9 - CONCLUSION */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6 flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-lg">09</span>
            The Point Isn't the Number, It's the Direction
          </h2>

          <p className="text-gray-300 mb-6">
            Whether it's 70% of jobs or 99% of tasks, whether it's 2028 or 2035—the precise number doesn't matter as much as:
          </p>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <TrendingDown className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
                <span><strong className="text-white">The trend:</strong> AI gets cheaper, faster, more capable</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="text-yellow-400 mt-1 flex-shrink-0" size={18} />
                <span><strong className="text-white">The speed:</strong> Institutions move slower than the technology</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="text-purple-400 mt-1 flex-shrink-0" size={18} />
                <span><strong className="text-white">The asymmetry:</strong> Being early compounds; being late hurts</span>
              </li>
            </ul>
          </div>

          <p className="text-gray-300 mb-4">
            You don't have to become a full-time futurist.<br />
            You don't have to nail every prediction.
          </p>

          <p className="text-gray-300 mb-8">
            You just have to do what people in every upheaval have done:
          </p>

          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3 text-gray-300">
              <Lightbulb className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
              <span>Look honestly at what's coming</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300">
              <Lightbulb className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
              <span>Stop assuming "they" will handle it for you</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300">
              <Lightbulb className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
              <span>Start building assets, reputation, and community that don't evaporate when the job titles do</span>
            </li>
          </ul>

          <div className="bg-gradient-to-br from-cyan-950/40 to-purple-950/40 border border-cyan-500/50 rounded-xl p-8 text-center">
            <p className="text-gray-300 mb-4">
              If "99% of jobs automated by 2030" is a headline, the real story is simpler:
            </p>
            <blockquote className="text-xl text-white font-medium leading-relaxed mb-6">
              Most of the ways we earn money today won't exist in their current form.
              You can wait for that to happen to you, or you can start building the next form now.
            </blockquote>
            <p className="text-gray-300">
              If you're ready to start, you don't need permission.<br />
              <span className="text-cyan-400">You just need to pick a lifeboat and begin loading it with the best of your mind.</span>
            </p>
          </div>
        </section>

        {/* SECTION 10 - ACTION CHECKLIST */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white font-orbitron mb-6 flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-lg">10</span>
            Your Starter Checklist
          </h2>

          <p className="text-gray-300 mb-8">
            You don't need to do everything at once. But if you do nothing, you're betting your future on institutions that are already behind. Here's a simple starting point:
          </p>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-8">
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 border-2 border-cyan-500/50 rounded flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Pick 10 pieces of past work or threads you're proud of</p>
                  <p className="text-sm text-gray-400">Client deliverables, X threads, Slack explanations, Notion docs—anything where you showed judgment.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 border-2 border-cyan-500/50 rounded flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Write 3 potential "intel products" those could become</p>
                  <p className="text-sm text-gray-400">A playbook? A checklist? A benchmark report? A tactical guide?</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 border-2 border-cyan-500/50 rounded flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Choose a home for those assets</p>
                  <p className="text-sm text-gray-400">Apex, your own site, Gumroad, Substack—somewhere you own the relationship.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 border-2 border-cyan-500/50 rounded flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Transform and publish at least one asset</p>
                  <p className="text-sm text-gray-400">Done is better than perfect. Get something out there and iterate.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-cyan-950/30 to-purple-950/30 border border-cyan-900/50 rounded-xl p-6">
            <p className="text-white font-medium mb-4">
              If you want a place built specifically for this—turning your history and curation into sellable intel backed by cash and reputation:
            </p>
            <p className="text-gray-300">
              <span className="text-cyan-400">Join the Apex early access list.</span> You'll be among the first to build assets on a platform designed for the post-AI economy.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-bold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/25"
            >
              Get Early Access to Apex
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/landing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-700 text-white font-medium rounded-lg transition-all duration-300"
            >
              <FileText size={20} />
              Explore How It Works
            </Link>
          </div>
          <p className="text-gray-500 text-sm font-mono">
            BUILD YOUR POST-AI INCOME NOW
          </p>
        </div>

        {/* FOOTER NAV */}
        <div className="mt-16 flex justify-between items-center pt-8 border-t border-gray-800">
          <Link href="/intel" className="text-gray-500 text-sm font-mono hover:text-cyan-400 transition-colors">
            ← BACK TO INTEL
          </Link>
          <Link href="/landing" className="text-gray-500 text-sm font-mono hover:text-cyan-400 transition-colors">
            APEX LANDING PAGE →
          </Link>
        </div>
      </article>
    </main>
  );
}
