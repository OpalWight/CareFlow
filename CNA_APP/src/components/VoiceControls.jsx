import React, { useState, useEffect } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useTextToSpeech from '../hooks/useTextToSpeech';
import '../styles/VoiceControls.css';

const VoiceControls = ({ 
  onTranscriptChange, 
  onNewMessage,
  autoSpeakEnabled = true,
  showSettings = false 
}) => {
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isRecordingComplete, setIsRecordingComplete] = useState(false);
  
  const {
    isListening,
    transcript,
    fullTranscript,
    isSupported: speechSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();
  
  const {
    isSpeaking,
    isPaused,
    isSupported: ttsSupported,
    voices,
    selectedVoice,
    rate,
    pitch,
    volume,
    error: ttsError,
    speak,
    stop,
    pause,
    resume,
    toggleAutoSpeak,
    changeVoice,
    changeRate,
    changePitch,
    changeVolume
  } = useTextToSpeech();

  // Handle transcript changes
  useEffect(() => {
    if (onTranscriptChange && fullTranscript) {
      onTranscriptChange(fullTranscript);
    }
  }, [fullTranscript, onTranscriptChange]);

  // Handle auto-speak setting
  useEffect(() => {
    toggleAutoSpeak(autoSpeakEnabled);
  }, [autoSpeakEnabled, toggleAutoSpeak]);

  const handleMicrophoneClick = () => {
    if (isListening) {
      stopListening();
      setIsRecordingComplete(true);
      // Give user a moment to see the complete transcript
      setTimeout(() => setIsRecordingComplete(false), 2000);
    } else {
      resetTranscript();
      setIsRecordingComplete(false);
      startListening();
    }
  };

  const handleSpeakClick = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      stop();
    }
  };

  const handleSendVoiceMessage = () => {
    if (fullTranscript && onNewMessage) {
      onNewMessage(fullTranscript);
      resetTranscript();
      setIsRecordingComplete(false);
    }
  };

  const getMicrophoneIcon = () => {
    if (isListening) {
      return '🎤'; // Recording
    } else if (isRecordingComplete) {
      return '✓'; // Complete
    } else {
      return '🎙️'; // Ready
    }
  };

  const getSpeakerIcon = () => {
    if (isSpeaking) {
      return isPaused ? '▶️' : '⏸️';
    } else {
      return '🔊';
    }
  };

  const getStatusText = () => {
    if (speechError) return `Error: ${speechError}`;
    if (ttsError) return `TTS Error: ${ttsError}`;
    if (isListening) return 'Listening...';
    if (isRecordingComplete) return 'Recording complete!';
    if (isSpeaking) return isPaused ? 'Paused' : 'Speaking...';
    return 'Ready';
  };

  if (!speechSupported && !ttsSupported) {
    return (
      <div className="voice-controls-unsupported">
        <span className="error-message">
          Voice features are not supported in this browser. Please use Chrome, Edge, or Safari.
        </span>
      </div>
    );
  }

  return (
    <div className="voice-controls">
      <div className="voice-buttons">
        {speechSupported && (
          <div className="voice-input-section">
            <button
              className={`voice-button microphone-button ${isListening ? 'recording' : ''} ${isRecordingComplete ? 'complete' : ''}`}
              onClick={handleMicrophoneClick}
              title={isListening ? 'Stop recording' : 'Start voice input'}
              disabled={!!speechError}
            >
              <span className="voice-icon">{getMicrophoneIcon()}</span>
            </button>
            
            {(transcript || fullTranscript) && (
              <div className="transcript-preview">
                <span className="interim-text">{transcript}</span>
                <span className="final-text">{fullTranscript}</span>
              </div>
            )}
            
            {isRecordingComplete && fullTranscript && (
              <button
                className="send-voice-button"
                onClick={handleSendVoiceMessage}
                title="Send voice message"
              >
                Send
              </button>
            )}
          </div>
        )}
        
        {ttsSupported && (
          <div className="voice-output-section">
            <button
              className={`voice-button speaker-button ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleSpeakClick}
              title={isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Stop all speech'}
              disabled={!!ttsError}
            >
              <span className="voice-icon">{getSpeakerIcon()}</span>
            </button>
          </div>
        )}
        
        {showSettings && (voices.length > 0 || speechSupported) && (
          <button
            className="voice-button settings-button"
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            title="Voice settings"
          >
            ⚙️
          </button>
        )}
      </div>
      
      <div className="voice-status">
        <span className={`status-text ${speechError || ttsError ? 'error' : ''}`}>
          {getStatusText()}
        </span>
      </div>
      
      {showVoiceSettings && (
        <div className="voice-settings-panel">
          <h4>Voice Settings</h4>
          
          {voices.length > 0 && (
            <div className="setting-group">
              <label htmlFor="voice-select">Voice:</label>
              <select
                id="voice-select"
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = voices.find(v => v.name === e.target.value);
                  changeVoice(voice);
                }}
              >
                {voices.map((voice, index) => (
                  <option key={index} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="setting-group">
            <label htmlFor="rate-slider">Speed: {rate.toFixed(1)}</label>
            <input
              id="rate-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => changeRate(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="setting-group">
            <label htmlFor="pitch-slider">Pitch: {pitch.toFixed(1)}</label>
            <input
              id="pitch-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => changePitch(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="setting-group">
            <label htmlFor="volume-slider">Volume: {Math.round(volume * 100)}%</label>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={autoSpeakEnabled}
                onChange={(e) => toggleAutoSpeak(e.target.checked)}
              />
              Auto-read AI responses
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceControls;