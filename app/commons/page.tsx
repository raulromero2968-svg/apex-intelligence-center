'use client';

import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { TitanHeader } from '@/components/ui/TitanHeader';

export default function CommonsPage() {
  return (
    <main className="min-h-screen pt-24 px-6 relative z-10">
      <TitanHeader
        title="APEX COMMONS"
        subtitle="COMMUNITY PROTOCOLS // ACTIVE"
      />

      <DigitalScrollWrapper>
        <div className="space-y-12">
          {/* Section 1 */}
          <section className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">A Community Built on Gratitude, Not Idolatry</h2>
            <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-lg text-left">
              <h3 className="text-cyan-400 font-mono text-sm mb-4 uppercase tracking-wider text-center">/// A Note on Heroes</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                At Apex Commons, we celebrate the work, not the person. We refuse to turn market analysts into gods.
                We stay clear-eyed about their limits and remember the invisible systems behind every famous face.
              </p>
              <div className="border-l-2 border-cyan-500 pl-4 mt-6">
                <h4 className="text-white font-bold text-sm">Our Stance</h4>
                <ul className="list-disc list-inside text-slate-400 text-sm mt-2 space-y-1">
                  <li>We celebrate people who use their power well.</li>
                  <li>We stay clear-eyed about their limits.</li>
                  <li>We build cultures where no one has to be a god.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 text-center">Our Principles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Celebrate the Work", desc: "We honor people who create positive change." },
                { title: "Stay Clear-Eyed", desc: "Even heroes are human. We acknowledge limits." },
                { title: "Remember the Many", desc: "Behind every famous face are invisible workers." },
                { title: "Keep Your Agency", desc: "No leader is your conscience." }
              ].map((item, i) => (
                <div key={i} className="p-4 border border-slate-800 bg-slate-950/50 hover:border-cyan-500/50 transition-colors">
                  <h3 className="text-cyan-400 font-bold text-sm mb-1">{item.title}</h3>
                  <p className="text-slate-500 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DigitalScrollWrapper>
    </main>
  );
}
