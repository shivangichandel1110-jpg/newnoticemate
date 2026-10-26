import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, FastForward } from 'lucide-react';
import { AppSettings } from '../types/notice';

interface AudioSpeechBarProps {
  textToSpeak: string;
  title?: string;
  language?: 'en' | 'hi';
  settings: AppSettings;
}

export const AudioSpeechBar: React.FC<AudioSpeechBarProps> = ({
  textToSpeak,
  title = 'Summary',
  language = 'en',
  settings,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(settings.voiceRate || 1.0);
  const [supported, setSupported] = useState(true);
  const [serverAudioLoading, setServerAudioLoading] = useState(false);
  const serverAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (serverAudioRef.current) {
        serverAudioRef.current.pause();
        serverAudioRef.current = null;
      }
    };
  }, []);

  // When text or language changes, stop active speech
  useEffect(() => {
    stopSpeech();
  }, [textToSpeak, language]);

  const speakWithBrowser = () => {
    if (!('speechSynthesis' in window)) {
      speakWithServerTTS();
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = textToSpeak.replace(/[\*\#\_]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = playbackRate;
    utterance.pitch = settings.voicePitch || 1.0;

    // Pick appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = language === 'hi' ? 'hi' : 'en';
    const targetVoice =
      voices.find((v) => v.lang.startsWith(langCode)) ||
      voices.find((v) => v.lang.includes('IN')) ||
      voices[0];

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Browser speech synthesis error, trying server fallback:', e);
      setIsPlaying(false);
      setIsPaused(false);
      speakWithServerTTS();
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakWithServerTTS = async () => {
    try {
      setServerAudioLoading(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak.slice(0, 800),
          voiceName: 'Kore',
        }),
      });

      if (!res.ok) throw new Error('Server TTS failed');
      const data = await res.json();
      if (data.audioBase64) {
        const audioSrc = `data:audio/wav;base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        serverAudioRef.current = audio;
        audio.playbackRate = playbackRate;
        audio.onplay = () => {
          setIsPlaying(true);
          setIsPaused(false);
          setServerAudioLoading(false);
        };
        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
        audio.onerror = () => {
          setIsPlaying(false);
          setServerAudioLoading(false);
        };
        await audio.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
      setIsPlaying(false);
      setServerAudioLoading(false);
    }
  };

  const handlePlay = () => {
    if (isPaused && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else if (serverAudioRef.current && isPaused) {
      serverAudioRef.current.play();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      speakWithBrowser();
    }
  };

  const handlePause = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    } else if (serverAudioRef.current && !serverAudioRef.current.paused) {
      serverAudioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (serverAudioRef.current) {
      serverAudioRef.current.pause();
      serverAudioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const toggleRate = () => {
    const rates = [0.85, 1.0, 1.25, 1.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (isPlaying) {
      stopSpeech();
    }
  };

  return (
    <div
      role="region"
      aria-label="Text to speech controls"
      className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#FFF9F2] border border-[#EAE4E8] rounded-2xl shadow-xs"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-[#E8DFF5] text-[#8273B8] flex items-center justify-center">
          {isPlaying ? (
            <Volume2 className="w-5 h-5 animate-pulse" aria-hidden="true" />
          ) : (
            <VolumeX className="w-5 h-5 text-[#6F6B78]" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-[#373444] uppercase tracking-wide">
            Read Aloud ({title})
          </p>
          <p className="text-xs text-[#6F6B78]">
            {serverAudioLoading
              ? 'Loading voice synthesis...'
              : isPlaying
              ? `Speaking in ${language === 'hi' ? 'Hindi' : 'English'} (${playbackRate}x)`
              : isPaused
              ? 'Paused'
              : 'Listen to clear voice explanation'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleRate}
          title="Change playback speed"
          aria-label={`Playback speed: ${playbackRate}x. Click to change.`}
          className="px-2.5 py-1 text-xs font-medium text-[#6F6B78] hover:text-[#373444] bg-[#FFFFFF] border border-[#EAE4E8] rounded-lg cursor-pointer"
        >
          {playbackRate}x
        </button>

        {!isPlaying && !isPaused ? (
          <button
            onClick={handlePlay}
            disabled={serverAudioLoading || !textToSpeak}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8273B8] hover:bg-[#7061A6] text-white text-xs font-medium rounded-xl cursor-pointer disabled:opacity-50"
            aria-label="Start reading aloud"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Listen</span>
          </button>
        ) : isPlaying ? (
          <button
            onClick={handlePause}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8E2D5] text-[#373444] hover:bg-[#ebd3c4] text-xs font-medium rounded-xl cursor-pointer"
            aria-label="Pause reading"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8273B8] text-white hover:bg-[#7061A6] text-xs font-medium rounded-xl cursor-pointer"
            aria-label="Resume reading"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume</span>
          </button>
        )}

        {(isPlaying || isPaused) && (
          <button
            onClick={stopSpeech}
            className="p-1.5 text-[#6F6B78] hover:text-[#373444] bg-[#FFFFFF] border border-[#EAE4E8] rounded-xl cursor-pointer"
            aria-label="Stop reading"
            title="Stop"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
