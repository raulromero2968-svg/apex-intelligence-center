import SectionShell from "../(sections)/SectionShell";
import { Twitter, Linkedin, Instagram, Github } from 'lucide-react';
import { SOCIAL_PROFILES } from '@/lib/constants';

export const revalidate = 3600;

export default function AboutPage() {
  return (
    <SectionShell title="About" kicker="Apex Intelligence">
      <div className="space-y-8">
        <p className="text-white/80 text-lg">
          Institutional-grade TCG market intelligence. Built for speed, accuracy, and edge.
        </p>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">Our Mission</h2>
          <p className="text-white/80">
            We provide underground intelligence for serious TCG collectors and investors,
            leveraging AI-powered research and institutional-grade analytics to deliver
            actionable market insights.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">Connect With Us</h2>
          <p className="text-white/60 text-sm mb-4">
            Follow our official channels for the latest TCG market intelligence, research updates, and community insights.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href={SOCIAL_PROFILES.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors"
            >
              <Twitter className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">X (Twitter)</div>
                <div className="text-gray-400 text-sm">@TCGAISociety</div>
              </div>
            </a>

            <a
              href={SOCIAL_PROFILES.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors"
            >
              <Linkedin className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">LinkedIn</div>
                <div className="text-gray-400 text-sm">TCGAISociety</div>
              </div>
            </a>

            <a
              href={SOCIAL_PROFILES.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors"
            >
              <Instagram className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">Instagram</div>
                <div className="text-gray-400 text-sm">@TCGAISociety</div>
              </div>
            </a>

            <a
              href={SOCIAL_PROFILES.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors"
            >
              <Github className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">GitHub</div>
                <div className="text-gray-400 text-sm">Open Source</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

