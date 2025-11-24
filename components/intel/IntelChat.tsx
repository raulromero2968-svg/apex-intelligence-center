'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, Bot, Users, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for our chat system
type MessageType = 'user' | 'system' | 'agent';

interface Message {
  id: string;
  type: MessageType;
  sender: string;
  text: string;
  timestamp: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

// Mock data generators for the simulation
const MOCK_USERS = ['CardShark_99', 'AlphaHunter', 'GemMint_Dave', 'VintageWhale'];
const MOCK_ALERTS = [
  '⚠️ Whale Alert: 5x Black Lotus Alpha moved to Vault',
  '📈 Market Mover: Charizard Base Set up 2.4% in last hour',
  '🤖 VARC Scan: Potential counterfeit detected in recent eBay listing',
  '🔔 New Listing: PSA 10 Umbreon VMAX Alt Art - $850 (Undervalued)'
];

export const IntelChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      sender: 'SYSTEM',
      text: 'Connected to Apex Intelligence Network v2.4. Encrypted.',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: '2',
      type: 'agent',
      sender: 'Manus (AI)',
      text: 'Analyzing TCGPlayer volatility indices. Standby for opportunities.',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulation Engine: Inject random messages
  useEffect(() => {
    const interval = setInterval(() => {
      const randomType = Math.random() > 0.7 ? 'system' : 'user';
      const newMessage: Message = {
        id: Date.now().toString(),
        type: randomType === 'system' ? 'system' : 'user',
        sender: randomType === 'system' ? 'Apex_Bot' : MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
        text: randomType === 'system'
          ? MOCK_ALERTS[Math.floor(Math.random() * MOCK_ALERTS.length)]
          : `Just picked up a slab for $${Math.floor(Math.random() * 500) + 50}. Thoughts?`,
        timestamp: new Date().toLocaleTimeString(),
        sentiment: Math.random() > 0.5 ? 'bullish' : 'neutral'
      };

      setMessages(prev => [...prev.slice(-50), newMessage]); // Keep last 50 messages
    }, 5000 + Math.random() * 5000); // Random interval between 5-10s

    return () => clearInterval(interval);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      sender: 'You',
      text: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
          <span className="text-sm font-semibold text-white">Live Intel Feed</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 1,240 Online</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-900/50">PRO</span>
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-xs font-bold ${
                  msg.type === 'system' ? 'text-cyan-400' :
                  msg.type === 'agent' ? 'text-purple-400' : 'text-slate-300'
                }`}>
                  {msg.sender}
                </span>
                <span className="text-[10px] text-slate-600">{msg.timestamp}</span>
              </div>

              <div className={`px-3 py-2 rounded-lg max-w-[90%] text-sm leading-relaxed ${
                msg.type === 'system' ? 'bg-cyan-950/30 border border-cyan-900/50 text-cyan-100' :
                msg.sender === 'You' ? 'bg-indigo-600 text-white' :
                'bg-slate-800/50 text-slate-300'
              }`}>
                {msg.type === 'agent' && <Bot className="w-3 h-3 inline mr-2 text-purple-400" />}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Share intel..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <button
          type="submit"
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
