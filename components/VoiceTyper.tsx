'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusIndicator } from './StatusIndicator';
import { MicButton } from './MicButton';
import { TextDisplay } from './TextDisplay';
import { ControlBar } from './ControlBar';
import { ControlBox } from './ControlBox';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextStorage } from '@/hooks/useTextStorage';
import { translations, Language } from '@/lib/translations';

interface VoiceTyperProps {
  language?: Language;
  onLanguageChange?: (language: Language) => void;
  isPunctuationEnabled?: boolean;
}

const LANGUAGES = [
  { id: 'bengali', label: 'বাংলা', code: 'bn-BD' },
  { id: 'english', label: 'English', code: 'en-US' },
  { id: 'arabic', label: 'العربية', code: 'ar-SA' },
  { id: 'urdu', label: 'اردو', code: 'ur-PK' },
  { id: 'japanese', label: '日本語', code: 'ja-JP' },
] as const;

export function VoiceTyper({
  language: externalLanguage,
  onLanguageChange,
}: VoiceTyperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [internalLanguage, setInternalLanguage] = useState<Language>('bengali');
  const [isVoicePunctuationEnabled, setIsVoicePunctuationEnabled] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastProcessedTextRef = useRef('');
  const lastProcessedTimeRef = useRef(0);

  const language = externalLanguage || internalLanguage;
  const t = translations[language];
  const isRTL = language === 'arabic' || language === 'urdu';

  const currentLangObj = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];
  const languageCode = currentLangObj.code;

  const storageKey = 'konthoshor-universal-text';

  const { text, setText, clearText } = useTextStorage(storageKey);

  const handleFinalResult = useCallback((newText: string) => {
    if (!isMounted) return;

    // Secondary de-duplication for mobile browsers that might emit the same result twice
    const now = Date.now();
    const trimmedNew = newText.trim();
    if (trimmedNew === lastProcessedTextRef.current && (now - lastProcessedTimeRef.current) < 800) {
      return;
    }
    lastProcessedTextRef.current = trimmedNew;
    lastProcessedTimeRef.current = now;

    let processedSegment = newText;

    if (isVoicePunctuationEnabled) {
      if (language === 'bengali') {
        processedSegment = processedSegment.replace(/দাঁড়ি|দাড়ি/g, '।');
        processedSegment = processedSegment.replace(/কমা/g, ',');
        processedSegment = processedSegment.replace(/প্রশ্নবোধক/g, '?');
        processedSegment = processedSegment.replace(/বিস্ময়বোধক/g, '!');
      } else if (language === 'english') {
        processedSegment = processedSegment.replace(/full stop/gi, '.');
        processedSegment = processedSegment.replace(/comma/gi, ',');
        processedSegment = processedSegment.replace(/question mark/gi, '?');
        processedSegment = processedSegment.replace(/exclamation mark/gi, '!');
        processedSegment = processedSegment.replace(/colon/gi, ':');
        processedSegment = processedSegment.replace(/semicolon/gi, ';');
        processedSegment = processedSegment.replace(/dash/gi, '-');
        processedSegment = processedSegment.replace(/open quote/gi, '“');
        processedSegment = processedSegment.replace(/close quote/gi, '”');
        processedSegment = processedSegment.replace(/quote/gi, '"');
      } else if (language === 'arabic') {
        processedSegment = processedSegment.replace(/fasila/gi, '،');
        processedSegment = processedSegment.replace(/istifham/gi, '؟');
        processedSegment = processedSegment.replace(/colon arabic/gi, '؛');
        // Also keep native terms
        processedSegment = processedSegment.replace(/فاصلة/g, '،');
        processedSegment = processedSegment.replace(/علامة استفهام/g, '؟');
      } else if (language === 'urdu') {
        processedSegment = processedSegment.replace(/comma urdu/gi, '،');
        processedSegment = processedSegment.replace(/question urdu/gi, '؟');
        // Also keep native terms
        processedSegment = processedSegment.replace(/کوما/g, '،');
        processedSegment = processedSegment.replace(/سوالیہ نشان/g, '؟');
      } else if (language === 'japanese') {
        processedSegment = processedSegment.replace(/maru|まる|マル/g, '。');
        processedSegment = processedSegment.replace(/ten|てん|テン/g, '、');
      }
    }

    setText((prev: string) => {
      const start = textareaRef.current?.selectionStart ?? prev.length;
      const end = textareaRef.current?.selectionEnd ?? prev.length;
      const before = prev.substring(0, start);
      const after = prev.substring(end);

      // Trim the segment to handle spacing manually and avoid doubles
      const trimmedSegment = processedSegment.trim();
      if (!trimmedSegment) return prev;

      // Logic: If there is text before, and it doesn't end with space/newline, add one space.
      const needsLeadingSpace = before && !before.endsWith(' ') && !before.endsWith('\n');

      // Logic: If there is text after, and it doesn't start with space/newline, add one space.
      const needsTrailingSpace = after && !after.startsWith(' ') && !after.startsWith('\n');

      const combined =
        before +
        (needsLeadingSpace ? ' ' : '') +
        trimmedSegment +
        (needsTrailingSpace ? ' ' : '') +
        after;

      // Clean up: Replace multiple spaces with a single space and fix punctuation spacing
      const final = combined.replace(/ +/g, ' ').replace(/\s+([,।?!.،।])/g, '$1');

      // Update cursor position after the text is updated
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = before.length + (needsLeadingSpace ? 1 : 0) + trimmedSegment.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
          textareaRef.current.focus();
        }
      }, 0);

      return final;
    });
  }, [isMounted, language, setText, isVoicePunctuationEnabled]);

  const { interimText, status, startListening, stopListening } = useSpeechRecognition(languageCode, handleFinalResult);

  const setLanguage = (lang: Language) => {
    setInternalLanguage(lang);
    onLanguageChange?.(lang);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const insertTextAtCursor = useCallback((insertText: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentText = text;

    const newText = currentText.substring(0, start) + insertText + currentText.substring(end);
    setText(newText);

    // Set cursor position after insertion
    const newPos = start + insertText.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [text, setText]);

  const handleBackspace = useCallback(() => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentText = text;

    if (start === end && start > 0) {
      // Remove character before cursor
      const newText = currentText.substring(0, start - 1) + currentText.substring(end);
      setText(newText);

      const newPos = start - 1;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newPos, newPos);
          textareaRef.current.focus();
        }
      }, 0);
    } else if (start !== end) {
      // Remove selection
      const newText = currentText.substring(0, start) + currentText.substring(end);
      setText(newText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start, start);
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [text, setText]);

  const handleDeleteWord = useCallback(() => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentText = text;

    if (start !== end) {
      // Remove selection if exists
      const newText = currentText.substring(0, start) + currentText.substring(end);
      setText(newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start, start);
          textareaRef.current.focus();
        }
      }, 0);
      return;
    }

    if (start === 0) return;

    const before = currentText.substring(0, start);
    const after = currentText.substring(start);

    // Modern regex to handle words across languages. 
    // We target a sequence of non-spaces optionally followed by spaces.
    // For Japanese, where spaces are rare, this will delete the entire block until a space,
    // which effectively deletes the nearest "group".
    const match = before.match(/(\S+\s*)$/);
    
    if (match) {
      const deletedLength = match[0].length;
      const newBefore = before.substring(0, before.length - deletedLength);
      const newText = newBefore + after;
      setText(newText);

      const newPos = newBefore.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newPos, newPos);
          textareaRef.current.focus();
        }
      }, 0);
    } else {
      // If only spaces are before the cursor, delete those spaces
      const spaceMatch = before.match(/(\s+)$/);
      if (spaceMatch) {
        const newBefore = before.substring(0, before.length - spaceMatch[0].length);
        const newText = newBefore + after;
        setText(newText);
        const newPos = newBefore.length;
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(newPos, newPos);
            textareaRef.current.focus();
          }
        }, 0);
      }
    }
  }, [text, setText]);

  const handleEnter = useCallback(() => {
    insertTextAtCursor('\n');
  }, [insertTextAtCursor]);

  const handleSpace = useCallback(() => {
    insertTextAtCursor(' ');
  }, [insertTextAtCursor]);

  if (!isMounted) return null;

  const isListening = status === 'listening' || status === 'restarting';

  const handleClear = () => {
    if (isListening) stopListening();
    clearText();
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-1 sm:gap-1.5 min-h-0" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar: Language Switcher + Status Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-1 shrink-0 px-1">
        <div className="flex flex-wrap justify-center p-0.5 bg-white/5 rounded-xl w-full sm:w-auto border border-white/5 shadow-inner" dir="ltr">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id as Language)}
              className={`relative flex items-center justify-center min-h-[32px] sm:min-h-[36px] px-3 sm:px-4 py-1 text-xs font-bold transition-all duration-300 rounded-lg ${language === lang.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {language === lang.id && (
                <motion.div
                  layoutId="active-lang"
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 bengali-text">{lang.label}</span>
            </button>
          ))}
        </div>
        <div className="shrink-0 flex items-center gap-3">
          {/* Voice Punctuation Toggle */}
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => setIsVoicePunctuationEnabled(!isVoicePunctuationEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                isVoicePunctuationEnabled 
                  ? 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]' 
                  : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isVoicePunctuationEnabled ? 'bg-primary animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isVoicePunctuationEnabled ? 'Voice Punctuation: ON' : 'Voice Punctuation: OFF'}
              </span>
            </button>
            <AnimatePresence>
              {isVoicePunctuationEnabled && (
                <motion.span
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[8px] font-bold text-primary uppercase tracking-[0.2em] animate-pulse"
                >
                  Voice Control Active
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <StatusIndicator status={status} language={language} />
        </div>
      </div>

      {/* Main Text Area - Maximized */}
      <div className="w-full flex-1 flex flex-col min-h-0 relative">
        <TextDisplay
          text={text}
          interimText={interimText}
          onChange={setText}
          language={language}
          textareaRef={textareaRef}
        />
        

      </div>

      {/* Bottom Compact Toolbar */}
      <div className="shrink-0 w-full">
        <ControlBar text={text} onClear={handleClear} language={language}>
          <MicButton
            isListening={isListening}
            onStart={startListening}
            onStop={stopListening}
            disabled={status === 'not-supported'}
          />
        </ControlBar>
      </div>

      {/* Modern Control Box - Sticky at bottom */}
      <div className="shrink-0 w-full mt-1">
        <ControlBox
          language={language}
          onInsertText={insertTextAtCursor}
          onBackspace={handleBackspace}
          onDeleteWord={handleDeleteWord}
          onEnter={handleEnter}
          onSpace={handleSpace}
        />
      </div>

      <AnimatePresence>
        {status === 'not-supported' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm max-w-md shrink-0"
          >
            <p className="font-bold mb-1 bengali-text">
              {t.ui.notSupportedTitle}
            </p>
            <p className="opacity-80 bengali-text">
              {t.ui.notSupportedDesc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
