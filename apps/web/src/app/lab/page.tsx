import Link from 'next/link';
import { TrendingUp, Brain, Users, Microscope, Handshake, FileText, BookOpen, MessageSquare } from 'lucide-react';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import { DISSERTATION_CHAPTERS } from '@/components/phd/constants';
import { DissertationChapterBadge } from '@/components/phd/DissertationChapterBadge';

export const revalidate = 3600;

export const metadata = {
  title: "Apex Lab | Research",
  description: "Research at the intersection of systems analysis, AI ethics, and tool design. We build nothing that cannot be shut down if it causes harm.",
};

export default function LabPage() {
  return (
    <div className="relative min-h-screen pt-24">
      {/* PhD Framework - Chapter 05: Discussion */}
      <DissertationChapterBadge
        chapter={DISSERTATION_CHAPTERS.DISCUSSION}
        variant="floating"
      />

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-sans mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            RESEARCH
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              Apex
            </span>
            <span className="block text-holographic">
              Lab
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
            Research at the intersection of systems analysis, ethics, and tool design.
            We build nothing that cannot be shut down if it starts causing harm.
            <span className="inline-block w-3 h-5 bg-purple-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </section>

      {/* Research Streams Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="THREE RESEARCH STREAMS" classification="APEX LAB // ACTIVE RESEARCH">

            {/* Stream 1: Market Systems */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-sans">
                  <span className="text-cyan-400">[</span> STREAM 01 <span className="text-cyan-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              <div className="relative border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 to-slate-950/50 backdrop-blur-sm rounded-xl p-8 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white font-sans">MARKET SYSTEMS &amp; FORECASTING</h3>
                        <p className="text-slate-500 text-sm font-sans">TCG Markets as a Live-Fire Testbed</p>
                      </div>
                    </div>

                    <p className="text-slate-400 leading-relaxed mb-6">
                      We treat TCG markets as a live-fire testbed for forecasting methods, model calibration, and human-AI collaboration. Real stakes, contained risk, fully observable behavior.
                    </p>

                    <div className="space-y-4">
                      <h4 className="text-white font-sans text-sm font-bold">OUTPUTS:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-cyan-400 font-sans">-&gt;</span>
                          Price prediction experiments &amp; validation
                        </li>
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-cyan-400 font-sans">-&gt;</span>
                          Liquidity &amp; volatility studies
                        </li>
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-cyan-400 font-sans">-&gt;</span>
                          Postmortems on where our forecasts failed
                        </li>
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-cyan-400 font-sans">-&gt;</span>
                          Model calibration benchmarks
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                      <div className="absolute inset-4 border border-cyan-500/20 rounded-full animate-[spin_7s_linear_infinite_reverse]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-cyan-400 font-sans text-xs text-center">MARKET<br/>DATA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stream 2: AI & Animal Welfare */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-sans">
                  <span className="text-purple-400">[</span> STREAM 02 <span className="text-purple-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              </div>

              <div className="relative border border-purple-500/40 bg-gradient-to-br from-purple-950/30 to-slate-950/50 backdrop-blur-sm rounded-xl p-8 overflow-hidden">
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                        <Brain className="w-7 h-7 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white font-sans">AI &amp; ANIMAL WELFARE</h3>
                        <p className="text-slate-500 text-sm font-sans">Tracking the AI x Animals Field</p>
                      </div>
                    </div>

                    <p className="text-slate-400 leading-relaxed mb-6">
                      We track and interpret the fast-growing field of AI x animals: bioacoustic foundation models, ethical frameworks for AI in animal communication, and the impacts of AI on animal advocacy.
                    </p>

                    <div className="space-y-4">
                      <h4 className="text-white font-sans text-sm font-bold">OUTPUTS:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-purple-400 font-sans">-&gt;</span>
                          State-of-the-field reports on AI x animals
                        </li>
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-purple-400 font-sans">-&gt;</span>
                          Ethics briefs (&ldquo;If you build X, here&apos;s your risk checklist&rdquo;)
                        </li>
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-purple-400 font-sans">-&gt;</span>
                          Commentaries on ESP, Sentient Futures, Faunalytics, ACE
                        </li>
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-purple-400 font-sans">-&gt;</span>
                          NatureLM-audio and bioacoustics analysis
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 border border-purple-500/30 rounded-full animate-[spin_12s_linear_infinite]" />
                      <div className="absolute inset-4 border border-purple-500/20 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-purple-400 font-sans text-xs text-center">BIO<br/>SIGNALS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stream 3: Sentient-First System Design */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-sans">
                  <span className="text-cyan-400">[</span> STREAM 03 <span className="text-cyan-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              <div className="relative border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 to-purple-950/30 backdrop-blur-sm rounded-xl p-8 overflow-hidden">
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center">
                        <Users className="w-7 h-7 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white font-sans">SENTIENT-FIRST SYSTEM DESIGN</h3>
                        <p className="text-slate-500 text-sm font-sans">Systems That Treat All Beings as Stakeholders</p>
                      </div>
                    </div>

                    <p className="text-slate-400 leading-relaxed mb-6">
                      We explore what it would mean to design systems—from tools to institutions—that treat humans, non-human animals, and potentially future digital minds as stakeholders, not just data sources.
                    </p>

                    <div className="space-y-4">
                      <h4 className="text-white font-sans text-sm font-bold">OUTPUTS:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-cyan-400 font-sans">-&gt;</span>
                          Design patterns for &ldquo;ethical defaults&rdquo;
                        </li>
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-cyan-400 font-sans">-&gt;</span>
                          Protocols for avoiding harm and aggregating welfare
                        </li>
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-cyan-400 font-sans">-&gt;</span>
                          Models of AI safety + animal ethics + market design
                        </li>
                        <li className="flex items-start gap-3 text-slate-400 text-sm">
                          <span className="text-cyan-400 font-sans">-&gt;</span>
                          Digital minds moral consideration frameworks
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 border border-cyan-500/30 rounded-lg rotate-45 animate-[spin_15s_linear_infinite]" />
                      <div className="absolute inset-4 border border-purple-500/20 rounded-lg rotate-45 animate-[spin_10s_linear_infinite_reverse]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-cyan-400 font-sans text-xs text-center">SYSTEM<br/>DESIGN</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Working With the Field Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="ECOSYSTEM ALIGNMENT" classification="PARTNERS // COLLABORATORS">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-sans">
                <span className="text-purple-400">[</span> WORKING WITH THE FIELD <span className="text-purple-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            </div>

            <p className="text-slate-400 text-center max-w-3xl mx-auto mb-10 leading-relaxed">
              We aim to <span className="text-white font-bold">complement, not compete</span> with existing organizations in the AI x animals ecosystem.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* Technical Labs */}
              <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                  <Microscope className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-sans">TECHNICAL LABS</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Like Earth Species Project building bioacoustic foundation models (NatureLM-audio).
                </p>
                <p className="text-slate-500 text-xs font-sans">
                  WE INTERPRET &amp; CONTEXTUALIZE
                </p>
              </div>

              {/* Field Builders */}
              <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
                  <Handshake className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-sans">FIELD BUILDERS</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Like Sentient Futures running coordination, conferences, and fellowships.
                </p>
                <p className="text-slate-500 text-xs font-sans">
                  WE AMPLIFY &amp; SYNTHESIZE
                </p>
              </div>

              {/* Research Nonprofits */}
              <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-sans">RESEARCH NONPROFITS</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Like Faunalytics, Animal Charity Evaluators, and Open Paws.
                </p>
                <p className="text-slate-500 text-xs font-sans">
                  WE TRANSLATE FOR PRACTITIONERS
                </p>
              </div>
            </div>

            {/* Our Role */}
            <div className="relative border border-slate-700/50 bg-slate-900/30 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-lg font-bold text-white mb-6 font-sans text-center">OUR ROLE IN THE ECOSYSTEM</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h4 className="text-white font-sans text-sm mb-2">SYNTHESIZE</h4>
                  <p className="text-slate-500 text-xs">Curate and interpret research for practitioners</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <h4 className="text-white font-sans text-sm mb-2">STRESS-TEST</h4>
                  <p className="text-slate-500 text-xs">Experiment in smaller, bounded domains</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h4 className="text-white font-sans text-sm mb-2">DOCUMENT</h4>
                  <p className="text-slate-500 text-xs">Report what works and what breaks, in public</p>
                </div>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            FOLLOW THE WORK
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-sans">
            Interested in the research?
          </h2>

          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Subscribe for updates on what we&apos;re learning, where we&apos;re uncertain, and what we got wrong.
            No hype, no rush—just honest work.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] font-sans"
            >
              Subscribe for Updates
            </Link>
            <Link
              href="/philosophy"
              className="btn-tactical inline-flex items-center justify-center gap-2 px-8 py-4 text-lg"
            >
              Read Our Philosophy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
