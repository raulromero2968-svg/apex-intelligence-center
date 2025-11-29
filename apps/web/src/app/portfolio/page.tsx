'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Heart, Eye, Sparkles, TrendingUp, Award, Users, ArrowUpRight, Layers } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

// Sample curated collections data - diverse collection types
const collections = [
  {
    id: 1,
    title: "Sleeping Pokemon Collection",
    curator: "SleepyTrainer",
    curatorAvatar: "🌙",
    description: "Every Pokemon card featuring sleeping, resting, or drowsy Pokemon. A peaceful collection for the calm collector.",
    itemCount: 47,
    category: "Trading Cards",
    theme: "Peaceful",
    votes: 342,
    views: 1247,
    featured: true,
    tags: ["Pokemon", "TCG", "Themed"],
    thumbnail: "https://images.unsplash.com/photo-1542779283-429940ce8336?w=800&q=80",
  },
  {
    id: 2,
    title: "Vintage Nike Air Jordan Evolution",
    curator: "SneakerArchive",
    curatorAvatar: "👟",
    description: "Complete chronological collection of Air Jordan 1-14. Every colorway that defined a generation of basketball culture.",
    itemCount: 89,
    category: "Sneakers",
    theme: "Sports History",
    votes: 521,
    views: 2891,
    featured: true,
    tags: ["Sneakers", "Nike", "Vintage"],
    thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
  },
  {
    id: 3,
    title: "Funko Pop Horror Icons",
    curator: "PopCollectorX",
    curatorAvatar: "🎃",
    description: "Every horror movie villain from Freddy to Jason. A complete archive of terror in vinyl form.",
    itemCount: 124,
    category: "Vinyl Figures",
    theme: "Horror",
    votes: 298,
    views: 1456,
    featured: false,
    tags: ["Funko Pop", "Horror", "Movies"],
    thumbnail: "https://images.unsplash.com/photo-1608889476561-6242cfdbf622?w=800&q=80",
  },
  {
    id: 4,
    title: "Rare Earth Gemstone Specimens",
    curator: "GeologyNerd",
    curatorAvatar: "💎",
    description: "Museum-quality mineral specimens from around the world. Each stone tells a geological story millions of years old.",
    itemCount: 67,
    category: "Natural History",
    theme: "Geology",
    votes: 445,
    views: 1923,
    featured: false,
    tags: ["Gemstones", "Minerals", "Science"],
    thumbnail: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=800&q=80",
  },
  {
    id: 5,
    title: "Japanese Edo Period Artifacts",
    curator: "TokyoArchivist",
    curatorAvatar: "🏯",
    description: "Cultural artifacts from Japan's Edo period (1603-1868). Ceramics, textiles, and everyday objects that shaped a civilization.",
    itemCount: 52,
    category: "Cultural Artifacts",
    theme: "History",
    votes: 387,
    views: 1678,
    featured: false,
    tags: ["Japan", "History", "Artifacts"],
    thumbnail: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
  },
  {
    id: 6,
    title: "1980s Transformers G1 Complete",
    curator: "RetroToyVault",
    curatorAvatar: "🤖",
    description: "Every Generation 1 Transformer from 1984-1990. Mint in box. A time capsule of 80s toy engineering.",
    itemCount: 156,
    category: "Vintage Toys",
    theme: "Nostalgia",
    votes: 612,
    views: 3124,
    featured: true,
    tags: ["Transformers", "Toys", "1980s"],
    thumbnail: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
  },
  {
    id: 7,
    title: "Vinyl Records: Blue Note Jazz",
    curator: "JazzArchivist",
    curatorAvatar: "🎷",
    description: "Original Blue Note pressings from 1939-1967. The definitive collection of jazz's golden age.",
    itemCount: 203,
    category: "Music",
    theme: "Jazz",
    votes: 289,
    views: 1534,
    featured: false,
    tags: ["Vinyl", "Jazz", "Music"],
    thumbnail: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80",
  },
  {
    id: 8,
    title: "Academic Pokemon Cards",
    curator: "ProfessorOak",
    curatorAvatar: "🎓",
    description: "Pokemon cards featuring professors, researchers, and scholarly themes. For the intellectual collector.",
    itemCount: 34,
    category: "Trading Cards",
    theme: "Academic",
    votes: 187,
    views: 892,
    featured: false,
    tags: ["Pokemon", "TCG", "Academic"],
    thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
  },
];

const categories = [
  "All Collections",
  "Trading Cards",
  "Sneakers",
  "Vinyl Figures",
  "Natural History",
  "Cultural Artifacts",
  "Vintage Toys",
  "Music",
];

export default function PortfolioPage() {
  const [sortBy, setSortBy] = useState<'votes' | 'views' | 'newest'>('votes');
  const [selectedCategory, setSelectedCategory] = useState("All Collections");

  const featuredCollections = collections.filter(c => c.featured);
  
  const filteredCollections = selectedCategory === "All Collections"
    ? collections.filter(c => !c.featured)
    : collections.filter(c => !c.featured && c.category === selectedCategory);

  const sortedCommunity = [...filteredCollections].sort((a, b) => {
    if (sortBy === 'votes') return b.votes - a.votes;
    if (sortBy === 'views') return b.views - a.views;
    return b.id - a.id; // newest
  });

  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 pt-32 pb-16">
        <div className="max-w-6xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            CURATED COLLECTIONS // UNIVERSAL ARCHIVE
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-holographic">
              Portfolio
            </span>
            <span className="block text-white">
              Archive
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-4">
            A universal platform for passionate collectors. From trading cards to sneakers, gemstones to cultural artifacts—showcase your curated collections and discover what others are preserving.
          </p>

          <div className="flex items-center justify-center gap-6 text-sm text-slate-500 font-sans">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{collections.length} Collections</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-purple-400" />
              <span>{collections.reduce((sum, c) => sum + c.votes, 0)} Votes</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>{collections.reduce((sum, c) => sum + c.views, 0).toLocaleString()} Views</span>
            </div>
          </div>
        </div>
      </section>

      {/* Community Spotlight - Featured Collections */}
      <ScrollReveal>
        <section className="relative z-10 px-6 md:px-12 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              <h2 className="flex items-center gap-3 text-2xl tracking-wider font-sans">
                <Trophy className="w-6 h-6 text-purple-400" />
                <span className="text-holographic">[ COMMUNITY SPOTLIGHT ]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            </div>

            <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
              Top-voted collections chosen by the community. These curators have mastered the art of thematic collecting across all domains.
            </p>

            {/* Featured Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCollections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} featured />
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* All Collections */}
      <ScrollReveal>
        <section className="relative z-10 px-6 md:px-12 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <h2 className="flex items-center gap-3 text-2xl tracking-wider font-sans">
                <Sparkles 
                  className="w-6 h-6" 
                  strokeWidth={2.5} 
                  fill="none"
                  stroke="#a855f7"
                  style={{
                    filter: 'drop-shadow(0 0 6px #a855f7) drop-shadow(0 0 12px #06b6d4)'
                  }}
                />
                <span className="text-holographic">[ ALL COLLECTIONS ]</span>
              </h2>
            </div>

            {/* Category Filter */}
            <div className="mb-6 overflow-x-auto scrollbar-none">
              <div className="flex gap-2 pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-sans whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-black/40 text-slate-400 border border-slate-700/50 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm text-slate-500 font-sans">
                {sortedCommunity.length} collection{sortedCommunity.length !== 1 ? 's' : ''} found
              </p>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-1">
                <button
                  onClick={() => setSortBy('votes')}
                  className={`px-4 py-2 rounded-md text-sm font-sans transition-all ${
                    sortBy === 'votes'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Most Voted
                </button>
                <button
                  onClick={() => setSortBy('views')}
                  className={`px-4 py-2 rounded-md text-sm font-sans transition-all ${
                    sortBy === 'views'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Most Viewed
                </button>
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-4 py-2 rounded-md text-sm font-sans transition-all ${
                    sortBy === 'newest'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Newest
                </button>
              </div>
            </div>

            {/* Collections Grid */}
            {sortedCommunity.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCommunity.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto mb-6">
                  <Layers className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Collections Found</h3>
                <p className="text-slate-400 mb-6">Try selecting a different category or check back soon.</p>
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* Submit Your Collection CTA */}
      <ScrollReveal>
        <section className="relative z-10 px-6 md:px-12 py-20">
          <div className="max-w-3xl mx-auto">
            <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-cyan-950/20 backdrop-blur-sm transition-all duration-300 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="text-center p-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-sans mb-6">
                  <Award className="w-4 h-4" />
                  SUBMIT YOUR COLLECTION
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Have a Curated Collection?
                </h2>

                <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
                  Whether it's trading cards, sneakers, gemstones, or cultural artifacts—share your passion with the community. Get votes, gain recognition, and inspire fellow collectors.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/submit-collection"
                    className="btn-tactical btn-tactical-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base shadow-[0_0_40px_rgba(147,51,234,0.5)] font-sans"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                    SUBMIT COLLECTION
                  </Link>
                  <Link
                    href="/about"
                    className="btn-tactical inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-sans"
                  >
                    LEARN MORE
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}

// Collection Card Component
function CollectionCard({ collection, featured = false }: { collection: any; featured?: boolean }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
      featured
        ? 'border-purple-500/50 bg-gradient-to-br from-purple-950/40 to-cyan-950/40 hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20'
        : 'border-cyan-500/30 bg-black/40 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10'
    } backdrop-blur-md`}>
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/90 text-white text-xs font-bold">
          <Trophy className="w-3 h-3" />
          SPOTLIGHT
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={collection.thumbnail}
          alt={collection.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Curator Avatar */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xl">
            {collection.curatorAvatar}
          </div>
          <div>
            <p className="text-xs text-slate-400">Curated by</p>
            <p className="text-sm font-semibold text-white">{collection.curator}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category & Theme Badges */}
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-sans">
            {collection.category}
          </div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {collection.theme}
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
          {collection.title}
        </h3>

        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {collection.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{collection.itemCount} items</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-purple-400" />
              <span>{collection.votes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>{collection.views}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {collection.tags.map((tag: string) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded bg-slate-800/50 text-slate-400 border border-slate-700/50"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-sans">
            VIEW COLLECTION
          </button>
          <button className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all">
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
