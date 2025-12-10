// app/market/page.tsx
"use client";

import { useMemo, useState } from "react";
import { SectionShell } from "@/components/section-shell";

type Rarity = "Legendary" | "Epic" | "Rare" | "Uncommon" | "Common";

type Card = {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  change: number;
  domain: string;
  capabilities: string[];
};

const ALL_CARDS: Card[] = [
  // Legendary
  {
    id: "gpt5-apex",
    name: "GPT-5 Apex",
    rarity: "Legendary",
    price: 420,
    change: 3.5,
    domain: "Meta Reasoning",
    capabilities: ["Long-horizon planning", "Cross-domain synthesis"],
  },
  {
    id: "helios-swarm",
    name: "Helios Swarm",
    rarity: "Legendary",
    price: 380,
    change: -1.1,
    domain: "Multi-Agent",
    capabilities: ["Agentic coordination", "Distributed signal"],
  },
  // Epic
  {
    id: "claude-opus",
    name: "Claude 3 Opus",
    rarity: "Epic",
    price: 260,
    change: 2.4,
    domain: "Reasoning",
    capabilities: ["Long context", "Analysis", "Refinement"],
  },
  {
    id: "gpt4o-vision",
    name: "GPT-4o Vision",
    rarity: "Epic",
    price: 240,
    change: 1.9,
    domain: "Multimodal",
    capabilities: ["Vision", "Tool use", "Grounding"],
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    rarity: "Epic",
    price: 200,
    change: -1.2,
    domain: "Balanced",
    capabilities: ["Multimodal", "Latency-balanced"],
  },
  // Rare
  {
    id: "gpt35-turbo",
    name: "GPT-3.5 Turbo",
    rarity: "Rare",
    price: 120,
    change: 0.8,
    domain: "Text",
    capabilities: ["Fast", "Cheap", "General purpose"],
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku",
    rarity: "Rare",
    price: 110,
    change: -0.3,
    domain: "Summarization",
    capabilities: ["Speed", "Summaries", "Low-friction"],
  },
  {
    id: "sdxl",
    name: "Stable Diffusion XL",
    rarity: "Rare",
    price: 100,
    change: 5.2,
    domain: "Vision",
    capabilities: ["Image generation", "Open weights"],
  },
  {
    id: "midjourney-v6",
    name: "Midjourney V6",
    rarity: "Rare",
    price: 160,
    change: 3.8,
    domain: "Vision",
    capabilities: ["Artistic style", "Brand surfaces"],
  },
  // Uncommon
  {
    id: "dalle-2",
    name: "DALL·E 2",
    rarity: "Uncommon",
    price: 60,
    change: -2.1,
    domain: "Vision",
    capabilities: ["Image generation", "Editing"],
  },
  {
    id: "whisper-large",
    name: "Whisper Large",
    rarity: "Uncommon",
    price: 70,
    change: 1.5,
    domain: "Audio",
    capabilities: ["Speech-to-text", "Multilingual"],
  },
  {
    id: "codex",
    name: "Codex",
    rarity: "Uncommon",
    price: 80,
    change: 0.5,
    domain: "Code",
    capabilities: ["Code completion", "Multi-language"],
  },
  {
    id: "gemini-nano",
    name: "Gemini Nano",
    rarity: "Uncommon",
    price: 50,
    change: 2.8,
    domain: "On-device",
    capabilities: ["Edge devices", "Efficiency"],
  },
  // Common
  {
    id: "gpt3-davinci",
    name: "GPT-3 Davinci",
    rarity: "Common",
    price: 30,
    change: -1.5,
    domain: "Legacy",
    capabilities: ["Text generation", "Completion"],
  },
  {
    id: "claude-instant",
    name: "Claude Instant",
    rarity: "Common",
    price: 40,
    change: 0.2,
    domain: "Fast",
    capabilities: ["Cheap", "Responsive"],
  },
];

const rarityOrder: Rarity[] = [
  "Legendary",
  "Epic",
  "Rare",
  "Uncommon",
  "Common",
];

const rarityLabelColor: Record<Rarity, string> = {
  Legendary:
    "border-amber-400/70 text-amber-300 bg-gradient-to-r from-amber-500/10 to-orange-500/10",
  Epic: "border-fuchsia-400/70 text-fuchsia-300 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10",
  Rare: "border-cyan-400/70 text-cyan-300 bg-gradient-to-r from-cyan-500/10 to-sky-500/10",
  Uncommon:
    "border-emerald-400/70 text-emerald-300 bg-gradient-to-r from-emerald-500/10 to-teal-500/10",
  Common:
    "border-zinc-500/70 text-zinc-300 bg-gradient-to-r from-zinc-700/50 to-zinc-900",
};

type SortKey = "price" | "change" | "name";

export default function MarketPage() {
  const [selectedRarity, setSelectedRarity] = useState<Rarity | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filteredCards = useMemo(() => {
    let cards = [...ALL_CARDS];
    if (selectedRarity !== "All") {
      cards = cards.filter((c) => c.rarity === selectedRarity);
    }
    cards.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") {
        return a.name.localeCompare(b.name) * dir;
      }
      return (a[sortKey] - b[sortKey]) * dir;
    });
    return cards;
  }, [selectedRarity, sortKey, sortDir]);

  return (
    <SectionShell
      category="Market"
      badgeLabel="TCG MARKET"
      title="Nexus Economy TCG Market"
      subtitle="Model cards, decks, and signal engines priced as a living, reputation-weighted asset class."
      path="/market"
    >
      <div className="space-y-6">
        {/* Filters */}
        <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-100">
              Card Universe (mock)
            </p>
            <p className="text-[11px] text-zinc-400">
              Later, replace this with your real model registry or card index.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            {/* Rarity filters */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-zinc-500">Rarity:</span>
              <button
                onClick={() => setSelectedRarity("All")}
                className={`rounded-full border px-2 py-1 ${
                  selectedRarity === "All"
                    ? "border-cyan-400 text-cyan-200"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                All
              </button>
              {rarityOrder.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRarity(r)}
                  className={`rounded-full border px-2 py-1 ${
                    selectedRarity === r
                      ? "border-cyan-400 text-cyan-200"
                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-500">Sort:</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px]"
              >
                <option value="price">Price</option>
                <option value="change">Change</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
                className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-1"
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          {rarityOrder.map((rarity) => {
            const cardsForRarity = filteredCards.filter(
              (c) => c.rarity === rarity,
            );
            if (!cardsForRarity.length) return null;
            return (
              <div key={rarity} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
                    {rarity} Cards
                  </h2>
                  <span className="text-[11px] text-zinc-500">
                    {cardsForRarity.length} listed
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {cardsForRarity.map((card) => (
                    <article
                      key={card.id}
                      className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${rarityLabelColor[card.rarity]}`}
                          >
                            {card.rarity}
                          </div>
                          <h3 className="mt-2 text-sm font-semibold text-white">
                            {card.name}
                          </h3>
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Domain: {card.domain}
                          </p>
                          <ul className="mt-2 space-y-1 text-[11px] text-zinc-300">
                            {card.capabilities.map((cap) => (
                              <li key={cap}>• {cap}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-right text-xs">
                          <div className="text-zinc-200">
                            ${card.price.toFixed(2)}
                          </div>
                          <div
                            className={
                              card.change >= 0
                                ? "text-emerald-300"
                                : "text-red-300"
                            }
                          >
                            {card.change >= 0 ? "+" : ""}
                            {card.change.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <button className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-100 hover:bg-zinc-800">
                        View card details
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </SectionShell>
  );
}
