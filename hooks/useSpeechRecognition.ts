import { useState, useCallback, useRef, useEffect } from 'react';

type SpeechRecognitionStatus = 'ready' | 'listening' | 'restarting' | 'processing' | 'not-supported';

interface UseSpeechRecognitionReturn {
  interimText: string;
  status: SpeechRecognitionStatus;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  onFinalResult: (text: string) => void;
}

export function useSpeechRecognition(
  language: string = 'bn-BD',
  onFinalResult: (text: string) => void
): Omit<UseSpeechRecognitionReturn, 'onFinalResult'> {
  const [interimText, setInterimText] = useState('');
  const [status, setStatus] = useState<SpeechRecognitionStatus>('ready');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const shouldBeListeningRef = useRef(false);
  const lastProcessedIndexRef = useRef(-1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('not-supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;


    recognition.onstart = () => {
      isListeningRef.current = true;
      lastProcessedIndexRef.current = -1;
      setStatus('listening');
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          if (i > lastProcessedIndexRef.current) {
            onFinalResult(transcript);
            lastProcessedIndexRef.current = i;
          }
        } else {
          interimTranscript += transcript;
        }
      }
      
      setInterimText(interimTranscript);
    };

    recognition.onerror = (event: any) => {
      if (shouldBeListeningRef.current && (event.error === 'no-speech' || event.error === 'aborted')) {
        return; // Ignore these if we're trying to stay active
      }
      setError(`Speech recognition error: ${event.error}`);
      if (!shouldBeListeningRef.current) {
        setStatus('ready');
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      
      if (shouldBeListeningRef.current) {
        try {
          recognition.start();
          isListeningRef.current = true;
          return;
        } catch (e) {
          console.error('Restart failed:', e);
        }
      }
      
      setInterimText('');
      setStatus('ready');
    };

    recognitionRef.current = recognition;

    // Auto-restart if it was previously listening
    if (shouldBeListeningRef.current) {
      setStatus('restarting');
      try {
        recognition.start();
      } catch (e) {
        console.error('Speech recognition auto-start error:', e);
        setStatus('ready');
      }
    }

    return () => {
      if (recognitionRef.current) {
        // Nullify handlers to prevent state updates during cleanup
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
    };
  }, [language, onFinalResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        shouldBeListeningRef.current = true;
        recognitionRef.current.start();
      } catch (e) {
        console.error('Start listening error:', e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    interimText,
    status,
    error,
    startListening,
    stopListening,
  };
}
