import SectionShell from "../(sections)/SectionShell";

export const revalidate = 3600;

export default function CommunityPage() {
  return (
    <SectionShell title="Community Principles" kicker="Apex Commons">
      <div className="space-y-8">
        <p className="text-white/80 text-lg">
          Building cultures where good things happen—without anyone having to be a god.
        </p>

        <div className="space-y-6 py-8 border-t border-b border-cyan-500/20">
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold text-white">A Note on Heroes</h2>
            <p className="text-xl font-serif text-white/60 italic">
              Admire the work. Don&apos;t worship the person.
            </p>
          </div>

          <div className="space-y-4 text-white/80 leading-relaxed max-w-3xl">
            <p>
              At Apex Commons, we are honest about a simple human truth: we love heroes. We look for avatars of our
              values—singers, founders, activists—and we put them on pedestals.
            </p>

            <p>
              That instinct isn&apos;t stupid; it comes from a desire to see good prevail. But we refuse to turn people into gods.
            </p>

            <p>
              Even the people who do the most visible good—the humanitarians, the innovators, the truth-tellers—are
              still human. They have been both harmed and harmful. They make tradeoffs we don&apos;t see.
            </p>

            <div className="my-6 pl-6 border-l-2 border-cyan-400">
              <h3 className="text-xl font-serif font-bold text-white mb-4">Our stance is gratitude, not idolatry.</h3>
              <ul className="space-y-2 list-none">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>We celebrate people who use their power well.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>We stay clear-eyed about their limits.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>We remember the invisible systems and workers behind every famous face.</span>
                </li>
              </ul>
            </div>

            <p>
              No leader is your conscience. We can learn from them, be moved by them, and still keep our own moral agency.
              We build cultures where no one has to be a god for good things to happen.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-cyan-400">Why This Matters</h2>
          <p className="text-white/70">
            Hero worship creates fragile communities that collapse when their idols fall. By maintaining
            perspective—celebrating contributions while acknowledging humanity—we build resilient cultures
            that survive imperfection.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">In Practice</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
              <h3 className="font-semibold text-white mb-2">We Encourage</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>✓ Specific appreciation for work</li>
                <li>✓ Nuanced takes on public figures</li>
                <li>✓ Crediting teams and systems</li>
                <li>✓ Learning without wholesale adoption</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-pink-500/30 bg-pink-500/5">
              <h3 className="font-semibold text-white mb-2">We Redirect</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>⚠ Uncritical praise</li>
                <li>⚠ Assumptions of perfection</li>
                <li>⚠ Seeking moral guidance from celebrities</li>
                <li>⚠ Ignoring contributions of others</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
