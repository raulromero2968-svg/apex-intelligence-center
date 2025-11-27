// apps/web/src/app/portfolio/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio Archive | Apex Intelligence',
  description: 'Explore our gallery of holographic TCG cards and market intelligence artifacts.',
  openGraph: {
    title: 'Portfolio Archive | Apex Intelligence',
    description: 'A curated collection of holographic cards from our TCG market intelligence platform.',
    images: ['/images/portfolio-og.jpg'],
  },
};

const holographicCards = [
  { id: 1, name: 'Charizard Holo', image: '/images/cards/charizard.jpg', description: 'Rare holographic Charizard from Base Set.' },
  { id: 2, name: 'Pikachu Prism', image: '/images/cards/pikachu.jpg', description: 'Prism variant of Pikachu with market insights.' },
  // Add more placeholders or fetch from DB/API
];

export default function PortfolioPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-transparent">
      <h1 className="hollow-text">PORTFOLIO ARCHIVE</h1>
      <p className="text-center text-lg mb-8 text-gray-300">
        A gallery of holographic TCG cards curated by Apex Intelligence.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {holographicCards.map((card) => (
          <div
            key={card.id}
            className="relative group overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50"
          >
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-64 object-cover transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <h2 className="text-xl font-bold text-white">{card.name}</h2>
              <p className="text-sm text-gray-300">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
