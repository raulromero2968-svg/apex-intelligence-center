/**
 * GameSidebar Component - Usage Example
 *
 * This file demonstrates how to use the GameSidebar component
 * with sample data for a game page.
 */

import React from 'react';
import { GameSidebar, GameData } from './GameSidebar';

// Example 1: Complete game data with all fields
const completeGameData: GameData = {
  title: 'Cyberpunk 2077',
  developer: 'CD PROJEKT RED',
  publisher: 'CD PROJEKT RED',
  releaseDate: '2020-12-10',
  description:
    'Cyberpunk 2077 is an open-world, action-adventure RPG set in the dark future of Night City — a dangerous megalopolis obsessed with power, glamour, and ceaseless body modification.',
  coverImage: '/images/games/cyberpunk-2077-cover.jpg',
  genre: ['RPG', 'Open World', 'Action', 'Sci-Fi'],
  rating: 4.2,
  priceInfo: {
    currentPrice: 29.99,
    originalPrice: 59.99,
    discount: 50,
    historicalLow: 24.99,
    currency: 'USD',
    platformLinks: [
      {
        platform: 'Steam',
        url: 'https://store.steampowered.com/app/1091500/Cyberpunk_2077/',
      },
      {
        platform: 'PlayStation Store',
        url: 'https://store.playstation.com/cyberpunk-2077',
      },
      {
        platform: 'Xbox Store',
        url: 'https://www.xbox.com/games/store/cyberpunk-2077',
      },
      {
        platform: 'GOG',
        url: 'https://www.gog.com/game/cyberpunk_2077',
      },
    ],
  },
  playerStats: {
    currentOnline: 42500,
    allTimePeak: 1054388,
    averagePlayers: 35000,
    activePlayers: 125000,
  },
  relatedNews: [
    {
      id: '1',
      title: 'Cyberpunk 2077 Gets Major Update 2.1 With New Features',
      date: '2024-01-15',
      url: 'https://example.com/news/cyberpunk-update-2-1',
      source: 'GameSpot',
    },
    {
      id: '2',
      title: 'Phantom Liberty DLC Wins Best Expansion Award',
      date: '2024-01-10',
      url: 'https://example.com/news/phantom-liberty-award',
      source: 'IGN',
    },
    {
      id: '3',
      title: 'CD PROJEKT RED Announces New Cyberpunk Content',
      date: '2024-01-05',
      url: 'https://example.com/news/new-cyberpunk-content',
      source: 'PC Gamer',
    },
    {
      id: '4',
      title: 'Player Count Surges After Netflix Anime Release',
      date: '2023-12-20',
      url: 'https://example.com/news/player-surge',
      source: 'Polygon',
    },
    {
      id: '5',
      title: 'Cyberpunk 2077 Reaches New Milestone: 25 Million Copies Sold',
      date: '2023-12-15',
      url: 'https://example.com/news/sales-milestone',
      source: 'VGC',
    },
    {
      id: '6',
      title: 'Community Mod Adds New Customization Options',
      date: '2023-12-10',
      url: 'https://example.com/news/community-mod',
      source: 'Kotaku',
    },
  ],
};

// Example 2: Minimal game data (only required fields)
const minimalGameData: GameData = {
  title: 'Indie Game',
  developer: 'Indie Studio',
  publisher: 'Self Published',
  releaseDate: '2024-01-01',
  description: 'A minimalist indie game with a focus on storytelling and atmosphere.',
};

// Example 3: Game data without player stats (single-player game)
const singlePlayerGameData: GameData = {
  title: 'The Witcher 3: Wild Hunt',
  developer: 'CD PROJEKT RED',
  publisher: 'CD PROJEKT RED',
  releaseDate: '2015-05-19',
  description:
    'As war rages on throughout the Northern Realms, you take on the greatest contract of your life — tracking down the Child of Prophecy, a living weapon that can alter the shape of the world.',
  coverImage: '/images/games/witcher-3-cover.jpg',
  genre: ['RPG', 'Open World', 'Fantasy'],
  rating: 4.9,
  priceInfo: {
    currentPrice: 9.99,
    originalPrice: 39.99,
    discount: 75,
    historicalLow: 7.99,
    currency: 'USD',
    platformLinks: [
      {
        platform: 'Steam',
        url: 'https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/',
      },
      {
        platform: 'GOG',
        url: 'https://www.gog.com/game/the_witcher_3_wild_hunt',
      },
    ],
  },
  relatedNews: [
    {
      id: '1',
      title: 'Next-Gen Update Adds Ray Tracing Support',
      date: '2023-12-14',
      url: 'https://example.com/news/witcher-3-next-gen',
      source: 'GameSpot',
    },
  ],
};

// Usage in a page component
export default function GamePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content area */}
        <main className="flex-1">
          <h1 className="text-4xl font-bold text-white mb-6">
            Game Information
          </h1>
          {/* Your main game content here */}
        </main>

        {/* Sidebar */}
        <GameSidebar gameData={completeGameData} />
      </div>
    </div>
  );
}

// Alternative usage: Sidebar on the left
export function GamePageLeftSidebar() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row-reverse gap-8">
        {/* Main content area */}
        <main className="flex-1">
          <h1 className="text-4xl font-bold text-white mb-6">
            Game Information
          </h1>
          {/* Your main game content here */}
        </main>

        {/* Sidebar (appears on left on desktop) */}
        <GameSidebar gameData={completeGameData} />
      </div>
    </div>
  );
}

// Usage with custom className
export function GamePageCustomStyling() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <main className="flex-1">
          <h1 className="text-4xl font-bold text-white mb-6">
            Game Information
          </h1>
        </main>

        {/* Sidebar with custom styling */}
        <GameSidebar
          gameData={completeGameData}
          className="lg:sticky lg:top-24 lg:self-start"
        />
      </div>
    </div>
  );
}

// Usage with dynamic data (e.g., from API)
export function GamePageDynamic({ gameId }: { gameId: string }) {
  const [gameData, setGameData] = React.useState<GameData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch game data from API
    fetch(`/api/games/${gameId}`)
      .then(res => res.json())
      .then(data => {
        setGameData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching game data:', error);
        setLoading(false);
      });
  }, [gameId]);

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!gameData) {
    return <div className="text-white">Game not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <main className="flex-1">
          <h1 className="text-4xl font-bold text-white mb-6">
            {gameData.title}
          </h1>
        </main>
        <GameSidebar gameData={gameData} />
      </div>
    </div>
  );
}

/**
 * API Response Example
 *
 * Expected JSON structure when fetching from an API:
 */
export const exampleAPIResponse = {
  title: 'Elden Ring',
  developer: 'FromSoftware',
  publisher: 'Bandai Namco Entertainment',
  releaseDate: '2022-02-25',
  description: 'THE NEW FANTASY ACTION RPG. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.',
  coverImage: 'https://example.com/images/elden-ring-cover.jpg',
  genre: ['RPG', 'Action', 'Souls-like', 'Open World'],
  rating: 4.8,
  priceInfo: {
    currentPrice: 59.99,
    originalPrice: 59.99,
    discount: 0,
    historicalLow: 39.99,
    currency: 'USD',
    platformLinks: [
      {
        platform: 'Steam',
        url: 'https://store.steampowered.com/app/1245620/ELDEN_RING/',
      },
    ],
  },
  playerStats: {
    currentOnline: 125000,
    allTimePeak: 953426,
    averagePlayers: 95000,
    activePlayers: 850000,
  },
  relatedNews: [
    {
      id: '1',
      title: 'Shadow of the Erdtree DLC Announced',
      date: '2024-01-20',
      url: 'https://example.com/news/erdtree-dlc',
      source: 'IGN',
    },
  ],
};

