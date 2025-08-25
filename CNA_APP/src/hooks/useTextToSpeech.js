import { useState, useEffect, useRef, useCallback } from 'react';

const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(null);
  
  const utteranceRef = useRef(null);
  const isAutoSpeakEnabled = useRef(true);

  useEffect(() => {
    // Check browser support
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // Load available voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Set default voice (prefer English voices)
        const englishVoice = availableVoices.find(voice => 
          voice.lang.startsWith('en') && voice.default
        ) || availableVoices.find(voice => 
          voice.lang.startsWith('en')
        ) || availableVoices[0];
        
        setSelectedVoice(englishVoice);
      };
      
      // Load voices immediately
      loadVoices();
      
      // Also load voices when they become available (some browsers load them async)
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Check speaking state periodically
      const checkSpeakingState = () => {
        setIsSpeaking(window.speechSynthesis.speaking);
        if (window.speechSynthesis.speaking) {
          setTimeout(checkSpeakingState, 100);
        }
      };
      
      // Start checking if synthesis is active
      if (window.speechSynthesis.speaking) {
        checkSpeakingState();
      }
    } else {
      setIsSupported(false);
      setError('Text-to-speech is not supported in this browser.');
    }
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!isSupported) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }
    
    if (!text || text.trim() === '') {
      setError('No text provided to speak.');
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = options.rate || rate;
    utterance.pitch = options.pitch || pitch;
    utterance.volume = options.volume || volume;
    
    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setError(null);
      console.log('Started speaking:', text.substring(0, 50) + '...');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      console.log('Finished speaking');
    };
    
    utterance.onpause = () => {
      setIsPaused(true);
    };
    
    utterance.onresume = () => {
      setIsPaused(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setError(`Speech error: ${event.error}`);
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    utteranceRef.current = utterance;
    
    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error speaking:', err);
      setError('Failed to start text-to-speech. Please try again.');
    }
  }, [isSupported, selectedVoice, rate, pitch, volume]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSpeaking, isPaused]);

  const toggleAutoSpeak = useCallback((enabled) => {
    isAutoSpeakEnabled.current = enabled;
  }, []);

  const autoSpeak = useCallback((text) => {
    if (isAutoSpeakEnabled.current) {
      speak(text);
    }
  }, [speak]);

  const changeVoice = useCallback((voice) => {
    setSelectedVoice(voice);
  }, []);

  const changeRate = useCallback((newRate) => {
    setRate(Math.max(0.1, Math.min(10, newRate)));
  }, []);

  const changePitch = useCallback((newPitch) => {
    setPitch(Math.max(0, Math.min(2, newPitch)));
  }, []);

  const changeVolume = useCallback((newVolume) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  }, []);

  return {
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    selectedVoice,
    rate,
    pitch,
    volume,
    error,
    speak,
    stop,
    pause,
    resume,
    autoSpeak,
    toggleAutoSpeak,
    changeVoice,
    changeRate,
    changePitch,
    changeVolume,
    isAutoSpeakEnabled: isAutoSpeakEnabled.current
  };
};

export default useTextToSpeech;