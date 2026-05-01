'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Info, Globe, Mic } from 'lucide-react';

interface VoiceGuideProps {
  onClose: () => void;
}

interface CommandInfo {
  command: string;
  symbol: string;
  lang: string;
}

const COMMAND_DATA: Record<string, CommandInfo[]> = {
  English: [
    { command: 'full stop', symbol: '.', lang: 'English' },
    { command: 'comma', symbol: ',', lang: 'English' },
    { command: 'question mark', symbol: '?', lang: 'English' },
    { command: 'exclamation mark', symbol: '!', lang: 'English' },
    { command: 'colon', symbol: ':', lang: 'English' },
    { command: 'semicolon', symbol: ';', lang: 'English' },
    { command: 'dash', symbol: '-', lang: 'English' },
    { command: 'open quote', symbol: '“', lang: 'English' },
    { command: 'close quote', symbol: '”', lang: 'English' },
  ],
  Bangla: [
    { command: 'দাড়ি', symbol: '।', lang: 'Bangla' },
    { command: 'কমা', symbol: ',', lang: 'Bangla' },
    { command: 'প্রশ্নবোধক', symbol: '?', lang: 'Bangla' },
    { command: 'বিস্ময়বোধক', symbol: '!', lang: 'Bangla' },
  ],
  Arabic: [
    { command: 'fasila', symbol: '،', lang: 'Arabic' },
    { command: 'istifham', symbol: '؟', lang: 'Arabic' },
    { command: 'colon arabic', symbol: '؛', lang: 'Arabic' },
  ],
  Urdu: [
    { command: 'comma urdu', symbol: '،', lang: 'Urdu' },
    { command: 'question urdu', symbol: '؟', lang: 'Urdu' },
  ],
  Japanese: [
    { command: 'maru', symbol: '。', lang: 'Japanese' },
    { command: 'ten', symbol: '、', lang: 'Japanese' },
  ],
};

export function VoiceGuide({ onClose }: VoiceGuideProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = Object.entries(COMMAND_DATA).reduce((acc, [lang, commands]) => {
    const matches = commands.filter(c => 
      c.command.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.symbol.includes(searchQuery)
    );
    if (matches.length > 0) acc[lang] = matches;
    return acc;
  }, {} as Record<string, CommandInfo[]>);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100]"
      />
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 z-[101] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Mic size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Voice Help Guide</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Commands Library</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* Quick Tip */}
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex gap-4">
            <div className="text-blue-400 shrink-0 mt-1">
              <Info size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-blue-400">How to use voice</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Turn <span className="text-white font-bold">ON</span> voice control → Speak a command below → The punctuation will be inserted automatically at your cursor position.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search commands or symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Categories */}
          {Object.entries(filteredData).map(([lang, commands]) => (
            <div key={lang} className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Globe size={14} />
                <h5 className="text-[10px] font-bold uppercase tracking-widest">{lang} Commands</h5>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {commands.map((cmd, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-medium">Say</span>
                      <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">&quot;{cmd.command}&quot;</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">→</span>
                      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary text-lg font-bold">
                        {cmd.symbol}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(filteredData).length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No commands found for &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/5 border-t border-white/5">
          <p className="text-[10px] text-center text-slate-500 leading-relaxed">
            Voice commands only work when Voice Punctuation Control is enabled. Speak clearly and pause slightly before and after commands.
          </p>
        </div>
      </motion.div>
    </>
  );
}
