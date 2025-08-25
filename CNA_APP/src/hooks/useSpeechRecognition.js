import { useState, useEffect, useRef, useCallback } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        console.log('Speech recognition started');
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscriptResult = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscriptResult += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        setTranscript(interimTranscript);
        if (finalTranscriptResult) {
          setFinalTranscript(prev => prev + finalTranscriptResult);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error);
        setIsListening(false);
        
        // Handle specific errors
        switch (event.error) {
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access and try again.');
            break;
          case 'no-speech':
            setError('No speech detected. Please try speaking closer to your microphone.');
            break;
          case 'audio-capture':
            setError('Microphone not found. Please check your microphone connection.');
            break;
          case 'network':
            setError('Network error. Please check your internet connection.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        console.log('Speech recognition ended');
        
        // Auto-restart if we were listening and no error occurred
        if (isListening && !error) {
          restartTimeoutRef.current = setTimeout(() => {
            if (isListening) {
              recognition.start();
            }
          }, 100);
        }
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
    
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setError('Failed to start speech recognition. Please try again.');
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

  const getFullTranscript = useCallback(() => {
    return (finalTranscript + ' ' + transcript).trim();
  }, [finalTranscript, transcript]);

  return {
    isListening,
    transcript,
    finalTranscript,
    fullTranscript: getFullTranscript(),
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
};

export default useSpeechRecognition;