import SectionShell from "../(sections)/SectionShell";

export const revalidate = 3600;

export default function CommunityPage() {
  return (
    <SectionShell title="Community Principles" kicker="Who We&apos;re For">
      <div className="space-y-8">
        <p className="text-white/80 text-lg">
          Networks, not temples. We build cultures where good things happen—without anyone having to be a god.
        </p>

        {/* Who We Prioritize */}
        <div className="space-y-6 py-8 border-t border-b border-cyan-500/20">
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold text-white">Who Apex Is For</h2>
            <p className="text-xl font-serif text-white/60 italic">
              We especially prioritize people who have been chewed up by institutions.
            </p>
          </div>

          <div className="space-y-4 text-white/80 leading-relaxed max-w-3xl">
            <p>
              We care about outsiders: queer folks, neurodivergent people, those from lower socioeconomic
              backgrounds—anyone historically treated as disposable by schools, states, or corporations.
            </p>

            <p>
              We also care about ordinary people who still show up for each other despite everything:
              teachers, nurses, parents, caretakers, workers. The people who keep the world running
              while institutions take them for granted.
            </p>

            <div className="my-6 pl-6 border-l-2 border-cyan-400">
              <h3 className="text-xl font-serif font-bold text-white mb-4">Our commitment:</h3>
              <ul className="space-y-2 list-none">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>When there is a conflict between institutional convenience and human dignity, we side with dignity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>We do not design tools that treat people as data points or lab material.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>We aim for systems that hydrate mental health, not deplete it.</span>
                </li>
              </ul>
            </div>

            <p>
              This is not charity. It is recognition that systems designed for &ldquo;average&rdquo; users
              often fail everyone, while systems designed with marginalized users in mind tend to work better for all.
            </p>
          </div>
        </div>

        {/* Heroes Section */}
        <div className="space-y-6 py-8 border-b border-cyan-500/20">
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold text-white">A Note on Heroes</h2>
            <p className="text-xl font-serif text-white/60 italic">
              Admire the work. Don&apos;t worship the person.
            </p>
          </div>

          <div className="space-y-4 text-white/80 leading-relaxed max-w-3xl">
            <p>
              We are honest about a simple human truth: we love heroes. We look for avatars of our
              values and we put them on pedestals. That instinct comes from a desire to see good prevail.
              But we refuse to turn people into gods.
            </p>

            <p>
              Even the people who do the most visible good are still human. They have been both harmed
              and harmful. They make tradeoffs we don&apos;t see. No leader is your conscience.
            </p>

            <p>
              We can learn from them, be moved by them, and still keep our own moral agency.
              We build cultures where no one has to be a god for good things to happen.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-cyan-400">Why This Matters</h2>
          <p className="text-white/70">
            Hero worship creates fragile communities that collapse when their idols fall.
            Institutions designed only for &ldquo;normal&rdquo; users fail everyone at the margins.
            By maintaining perspective and centering dignity, we build resilient cultures that
            actually work.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">In Practice</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
              <h3 className="font-semibold text-white mb-2">We Encourage</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>✓ Specific appreciation for work, not personalities</li>
                <li>✓ Centering marginalized experiences in design</li>
                <li>✓ Transparency about power and uncertainty</li>
                <li>✓ Learning without wholesale adoption</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-pink-500/30 bg-pink-500/5">
              <h3 className="font-semibold text-white mb-2">We Redirect</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>⚠ Treating any system or person as holy</li>
                <li>⚠ Mystique as a weapon (&ldquo;genius,&rdquo; &ldquo;chosen few&rdquo;)</li>
                <li>⚠ Tools that destabilize mental health</li>
                <li>⚠ Ignoring invisible workers and systems</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
