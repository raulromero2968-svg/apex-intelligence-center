'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Type definitions for the game data structure
export interface PlatformLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface PlayerStats {
  activePlayers?: number;
  allTimePeak?: number;
  averagePlayers?: number;
  currentOnline?: number;
}

export interface PriceInfo {
  currentPrice?: number;
  originalPrice?: number;
  discount?: number;
  historicalLow?: number;
  currency?: string;
  platformLinks?: PlatformLink[];
}

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  url: string;
  source?: string;
}

export interface GameData {
  title: string;
  developer: string;
  publisher: string;
  releaseDate: string;
  description: string;
  coverImage?: string;
  priceInfo?: PriceInfo;
  playerStats?: PlayerStats;
  relatedNews?: NewsArticle[];
  genre?: string[];
  rating?: number;
}

interface GameSidebarProps {
  gameData: GameData;
  className?: string;
}

export const GameSidebar: React.FC<GameSidebarProps> = ({ gameData, className = '' }) => {
  const {
    title,
    developer,
    publisher,
    releaseDate,
    description,
    coverImage,
    priceInfo,
    playerStats,
    relatedNews,
    genre,
    rating,
  } = gameData;

  // Helper function to format numbers with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Helper function to format currency
  const formatPrice = (price: number, currency: string = 'USD'): string => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${price.toFixed(2)}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`w-full lg:w-80 xl:w-96 space-y-6 ${className}`}
    >
      {/* Game Header */}
      <div className="glass-dark rounded-xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all duration-300">
        {coverImage && (
          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
          </div>
        )}

        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

        {genre && genre.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {genre.map((g, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 rounded-md"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {rating && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(rating) ? 'text-cyan-400' : 'text-white/20'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-white/70">{rating.toFixed(1)}/5</span>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Developer:</span>
            <span className="text-white font-medium">{developer}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Publisher:</span>
            <span className="text-white font-medium">{publisher}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Release Date:</span>
            <span className="text-white font-medium">{formatDate(releaseDate)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="glass-dark rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full" />
          About
        </h3>
        <p className="text-white/70 text-sm leading-relaxed">{description}</p>
      </div>

      {/* Price Information */}
      {priceInfo && (
        <div className="glass-dark rounded-xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all duration-300">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full" />
            Pricing
          </h3>

          <div className="space-y-4">
            {priceInfo.currentPrice !== undefined && (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-cyan-400">
                  {formatPrice(priceInfo.currentPrice, priceInfo.currency)}
                </span>
                {priceInfo.discount && priceInfo.discount > 0 && (
                  <>
                    <span className="text-lg text-white/50 line-through">
                      {formatPrice(priceInfo.originalPrice || 0, priceInfo.currency)}
                    </span>
                    <span className="px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-500 rounded-md">
                      -{priceInfo.discount}%
                    </span>
                  </>
                )}
              </div>
            )}

            {priceInfo.historicalLow !== undefined && (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Historical Low:</span>
                  <span className="text-sm font-semibold text-purple-400">
                    {formatPrice(priceInfo.historicalLow, priceInfo.currency)}
                  </span>
                </div>
              </div>
            )}

            {priceInfo.platformLinks && priceInfo.platformLinks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/50 uppercase tracking-wide">Available On:</p>
                {priceInfo.platformLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-cyan-400/10 border border-white/10 hover:border-cyan-400/50 rounded-lg transition-all duration-300 group"
                  >
                    <span className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                      {link.platform}
                    </span>
                    <svg
                      className="w-4 h-4 text-white/50 group-hover:text-cyan-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Player Statistics */}
      {playerStats && (
        <div className="glass-dark rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full" />
            Player Stats
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {playerStats.currentOnline !== undefined && (
              <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-400/30">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <p className="text-xs text-white/50 uppercase tracking-wide">Online Now</p>
                </div>
                <p className="text-2xl font-bold text-cyan-400">
                  {formatNumber(playerStats.currentOnline)}
                </p>
              </div>
            )}

            {playerStats.allTimePeak !== undefined && (
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-lg border border-purple-400/30">
                <p className="text-xs text-white/50 mb-1 uppercase tracking-wide">All-Time Peak</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatNumber(playerStats.allTimePeak)}
                </p>
              </div>
            )}

            {playerStats.averagePlayers !== undefined && (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 mb-1 uppercase tracking-wide">30-Day Avg</p>
                <p className="text-xl font-bold text-white">
                  {formatNumber(playerStats.averagePlayers)}
                </p>
              </div>
            )}

            {playerStats.activePlayers !== undefined && (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 mb-1 uppercase tracking-wide">Active Players</p>
                <p className="text-xl font-bold text-white">
                  {formatNumber(playerStats.activePlayers)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related News */}
      {relatedNews && relatedNews.length > 0 && (
        <div className="glass-dark rounded-xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all duration-300">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full" />
            Latest News
          </h3>

          <div className="space-y-3">
            {relatedNews.slice(0, 5).map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-white/5 hover:bg-cyan-400/10 border border-white/10 hover:border-cyan-400/50 rounded-lg transition-all duration-300 group"
                >
                  <h4 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{article.source || 'Gaming News'}</span>
                    <span>{formatDate(article.date)}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {relatedNews.length > 5 && (
            <button className="w-full mt-4 px-4 py-2 text-sm font-semibold text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 hover:border-cyan-400/50 rounded-lg transition-all duration-300">
              View All News ({relatedNews.length})
            </button>
          )}
        </div>
      )}
    </motion.aside>
  );
};

export default GameSidebar;
