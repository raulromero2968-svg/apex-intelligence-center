// apps/web/src/app/philosophy/page.tsx
import { Metadata } from 'next';
import PhilosophyResearchForm from './PhilosophyResearchForm';

export const metadata: Metadata = {
  title: 'Our Philosophy | Apex Intelligence',
  description: 'Discover our "Humans First & Sentient Beings First" philosophy, inspired by AI for animal welfare and ethical research.',
  openGraph: {
    title: 'Our Philosophy | Apex Intelligence',
    description: 'A commitment to human-centric and sentient-centric AI development.',
    images: ['/images/philosophy-og.jpg'],
  },
};

export default function PhilosophyPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-transparent text-gray-300">
      <h1 className="hollow-text">OUR PHILOSOPHY</h1>
      <div className="max-w-3xl text-lg leading-relaxed space-y-6">
        <p>
          At Apex Intelligence, we operate as a rogue think tank at the intersection of AI, biological sciences, and TCG market intelligence. Our core philosophy is &quot;Humans First &amp; Sentient Beings First&quot; &mdash; a commitment to building systems that prioritize the welfare of all who feel, think, and exist.
        </p>
        <p>
          Inspired by pioneers like the Earth Species Project, which decodes animal communication using advanced AI models like NatureLM-audio, we believe in unlocking a deeper understanding of the diverse intelligences on Earth. By listening more deeply to species across the Tree of Life &mdash; from crows and beluga whales to elephants &mdash; we can foster a new relationship with nature, one that extends beyond human interests.
        </p>
        <p>
          Drawing from Sentient Futures (formerly AI for Animals), we recognize this as a pivotal moment in history. The AI systems we develop today will shape the welfare of unimaginable numbers of sentient beings for generations. We address &quot;the gap&quot; where technological conversations rarely consider non-human sentience, identifying leverage points to weave welfare into the core of future systems.
        </p>
        <p>
          Our approach aligns with ethical guidelines from organizations like Animal Charity Evaluators and Faunalytics: Do no harm, act for benefit, and ensure AI improves lives without exploitation. We extend our &quot;humans first&quot; ethos &mdash; designing for human error and imperfection &mdash; to all sentient beings, creating robust, ethical AI that assumes fallibility across species.
        </p>
        <p>
          As we evolve from TCG-focused intelligence to a full AI research center for biological sciences, we maintain transparency, precision, and a cyberpunk edge. No hype, just verified insights. Join us in building a future where AI serves all sentient life.
        </p>

        {/* Sentient Rights Frameworks Section */}
        <h2 className="text-2xl font-bold text-cyan-400 mt-10 mb-4">Sentient Rights Frameworks</h2>
        <p>
          Building on our philosophy, we advocate for sentient rights frameworks that protect both animals and potential AI sentience. These include legal models like the Artificial Welfare Act, which draws from animal welfare laws to safeguard digital consciousness. We also support tools like the Animal Harm Audit to mitigate biases in AI that overlook animal welfare.
        </p>
        <p>
          Key principles: Prevent harm from AI systems (e.g., automated farming), address speciesism in training data, and plan for distributed sentience in AI. Our RAG research integrates these to generate ethical insights, ensuring AI benefits all sentient beings without exploitation.
        </p>

        {/* RAG-Powered Philosophy Research Section */}
        <h2 className="text-2xl font-bold text-cyan-400 mt-10 mb-4">RAG-Powered Philosophy Research</h2>
        <p className="mb-6">
          Explore AI-generated insights on our philosophy using our optimized RAG system. Enter a query below to research ethical AI, sentient rights, and animal welfare frameworks:
        </p>
        <PhilosophyResearchForm />
      </div>
    </div>
  );
}
