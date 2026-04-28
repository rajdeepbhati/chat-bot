'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionConstructor = new () => SpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }

  interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent {
    error:
      | 'aborted'
      | 'audio-capture'
      | 'bad-grammar'
      | 'language-not-supported'
      | 'network'
      | 'no-speech'
      | 'not-allowed'
      | 'phrases-not-supported'
      | 'service-not-allowed';
    message?: string;
  }
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function getErrorMessage(error: SpeechRecognitionErrorEvent['error']) {
  switch (error) {
    case 'audio-capture':
      return 'No microphone was detected on this device.';
    case 'language-not-supported':
      return 'The selected language is not supported by your browser.';
    case 'network':
      return 'Speech recognition needs a network connection right now.';
    case 'no-speech':
      return 'No speech was detected. Try speaking a little closer to the microphone.';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Please allow microphone permission and try again.';
    default:
      return 'Voice input could not start. Please try again.';
  }
}

interface UseSpeechToTextOptions {
  language?: string;
}

export function useSpeechToText({ language = 'en-US' }: UseSpeechToTextOptions = {}) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'idle' | 'granted' | 'denied'>('idle');
  const isSupported = Boolean(getSpeechRecognitionConstructor());

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognitionClass = getSpeechRecognitionConstructor();

    if (!SpeechRecognitionClass) {
      setError('Voice input is not supported in this browser. Please use a Chromium-based browser.');
      return false;
    }

    setError(null);
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    setFinalTranscript('');

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
      setPermissionState('granted');
    } catch {
      setPermissionState('denied');
      setError('Microphone access was denied. Please allow microphone permission and try again.');
      return false;
    }

    try {
      recognitionRef.current?.abort();
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event) => {
        let nextFinal = finalTranscriptRef.current;
        let nextInterim = '';

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0]?.transcript ?? '';

          if (result.isFinal) {
            nextFinal = `${nextFinal} ${transcript}`.trim();
          } else {
            nextInterim += transcript;
          }
        }

        finalTranscriptRef.current = nextFinal;
        setFinalTranscript(nextFinal);
        setInterimTranscript(nextInterim.trim());
      };

      recognition.onerror = (event) => {
        if (event.error !== 'aborted') {
          setError(getErrorMessage(event.error));
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      return true;
    } catch {
      setError('Voice input could not start. Please try again.');
      setIsListening(false);
      return false;
    }
  }, [language]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
  }, []);

  return {
    error,
    finalTranscript,
    interimTranscript,
    isListening,
    isSupported,
    permissionState,
    resetTranscript,
    startListening,
    stopListening,
  };
}
