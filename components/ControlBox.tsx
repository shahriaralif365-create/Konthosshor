'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Delete, CornerDownLeft, Space as SpaceIcon } from 'lucide-react';
import { Language } from '@/lib/translations';

interface ControlBoxProps {
  language: Language;
  onInsertText: (text: string) => void;
  onBackspace: () => void;
  onDeleteWord: () => void;
  onEnter: () => void;
  onSpace: () => void;
}

type Category = 'Basic' | 'Language' | 'Quotes' | 'Brackets' | 'Dashes' | 'Math' | 'Currency' | 'Special' | 'Misc';

const SYMBOL_CATEGORIES: Record<Category, (language: Language) => string[]> = {
  Basic: () => ['.', ',', '?', '!', ':', ';', "'", '"', '-'],
  Language: (lang) => {
    switch (lang) {
      case 'bengali': return ['।', ',', '?', '!', ';', ':'];
      case 'english': return ['.', ',', '?', '!', ';', ':'];
      case 'japanese': return ['。', '、', '？', '！', '「', '」', '『', '』'];
      case 'arabic': return ['،', '؛', '؟', '«', '»'];
      case 'urdu': return ['،', '؛', '؟', '“', '”', '‘', '’'];
      default: return ['.', ',', '?', '!'];
    }
  },
  Quotes: () => ["'", '"', '‘', '’', '“', '”', '«', '»', '「', '」', '『', '』'],
  Brackets: () => ['(', ')', '[', ']', '{', '}', '<', '>'],
  Dashes: () => ['-', '–', '—', '_'],
  Math: () => ['+', '−', '×', '÷', '=', '≠', '≈', '<', '>', '≤', '≥', '%'],
  Currency: () => ['$', '€', '£', '¥', '৳', '₹', '﷼'],
  Special: () => ['@', '#', '&', '*', '/', '\\', '|', '~', '^', '`'],
  Misc: () => ['•', '…', '©', '®', '™', '✓', '✔', '✕', '§', '¶'],
};

const CATEGORIES: Category[] = ['Basic', 'Language', 'Quotes', 'Brackets', 'Dashes', 'Math', 'Currency', 'Special', 'Misc'];

export function ControlBox({
  language,
  onInsertText,
  onBackspace,
  onDeleteWord,
  onEnter,
  onSpace,
}: ControlBoxProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('Basic');
  const isRTL = language === 'arabic' || language === 'urdu';
  
  // Sync category with language change
  useEffect(() => {
    setActiveCategory('Language');
  }, [language]);

  const symbols = SYMBOL_CATEGORIES[activeCategory](language);

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border-t border-white/5 rounded-t-2xl shadow-2xl overflow-hidden shrink-0">
      <div className="max-w-4xl mx-auto px-2 py-1.5 sm:px-4 sm:py-2 flex flex-col gap-1.5">
        
        {/* Category Tabs & Controls Row */}
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5">
          {/* Compact Category Selector */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-fade-edges-sm py-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  activeCategory === cat 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Control Buttons with Icons and Labels */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-white/10">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onSpace}
              className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[56px] h-10 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all gap-0.5"
              title="Space"
            >
              <SpaceIcon size={14} strokeWidth={2.5} />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight opacity-60">Space</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onEnter}
              className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[56px] h-10 rounded-xl bg-blue-500/10 text-blue-400 hover:text-blue-300 transition-all gap-0.5"
              title="Insert New Line"
            >
              <CornerDownLeft size={14} strokeWidth={2.5} />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight opacity-60">Enter</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onDeleteWord}
              className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[85px] h-10 rounded-xl bg-red-500/20 text-red-400 hover:text-red-300 transition-all gap-0.5 border border-red-500/20"
              title="Delete previous word (Ctrl+Backspace)"
            >
              <Delete 
                size={16} 
                strokeWidth={2.5} 
                className={`transition-transform duration-300 ${isRTL ? 'rotate-180' : 'rotate-0'}`} 
              />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight opacity-80">Delete Word</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onBackspace}
              className="flex flex-col items-center justify-center min-w-[60px] sm:min-w-[70px] h-10 rounded-xl bg-red-500/10 text-red-400 hover:text-red-300 transition-all gap-0.5"
              title="Delete Character"
            >
              <Delete 
                size={14} 
                strokeWidth={2.5} 
                className={`transition-transform duration-300 ${isRTL ? 'rotate-180' : 'rotate-0'}`} 
              />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight opacity-60">Backspace</span>
            </motion.button>
          </div>
        </div>

        {/* Symbols Row - Horizontal Scrolling */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5">
          {symbols.map((char, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onInsertText(char)}
              className="min-w-[36px] h-9 sm:min-w-[40px] sm:h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-base font-medium text-white transition-colors shrink-0"
            >
              {char}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
