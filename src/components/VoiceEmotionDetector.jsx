import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Brain, Smile, Frown, Meh, AlertCircle } from 'lucide-react';

/**
 * Voice Emotion Detection
 * Analyzes voice tone to detect emotions in real-time
 * 5-10 years ahead: Real-time emotion recognition from voice
 */
const VoiceEmotionDetector = ({ onEmotionDetected, onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API for transcription
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript + interimTranscript;
        setTranscript(fullTranscript);
        if (onTranscription) {
          onTranscription(fullTranscript);
        }

        // Analyze emotion from transcript
        if (finalTranscript) {
          analyzeEmotion(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  }, [onTranscription]);

  const analyzeEmotion = (text) => {
    // Simple emotion detection based on keywords and patterns
    // In a real implementation, this would use ML models
    const lowerText = text.toLowerCase();
    
    const emotions = {
      happy: {
        keywords: ['great', 'awesome', 'wonderful', 'excited', 'love', 'amazing', 'fantastic', 'yes!', 'yeah!'],
        score: 0
      },
      sad: {
        keywords: ['sad', 'disappointed', 'sorry', 'unfortunately', 'bad', 'terrible', 'awful'],
        score: 0
      },
      neutral: {
        keywords: ['okay', 'fine', 'alright', 'sure', 'maybe'],
        score: 0
      },
      angry: {
        keywords: ['angry', 'frustrated', 'annoyed', 'hate', 'terrible', 'awful', 'worst'],
        score: 0
      }
    };

    // Calculate scores
    Object.keys(emotions).forEach(emotion => {
      emotions[emotion].score = emotions[emotion].keywords.reduce((score, keyword) => {
        return score + (lowerText.includes(keyword) ? 1 : 0);
      }, 0);
    });

    // Find dominant emotion
    const dominantEmotion = Object.keys(emotions).reduce((a, b) => 
      emotions[a].score > emotions[b].score ? a : b
    );

    const totalScore = Object.values(emotions).reduce((sum, e) => sum + e.score, 0);
    const confidence = totalScore > 0 ? emotions[dominantEmotion].score / totalScore : 0.5;

    setEmotion(dominantEmotion);
    setConfidence(confidence);
    
    if (onEmotionDetected) {
      onEmotionDetected({
        emotion: dominantEmotion,
        confidence,
        text
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsRecording(false);
    setEmotion(null);
    setConfidence(0);
    setTranscript('');
  };

  const getEmotionIcon = () => {
    switch (emotion) {
      case 'happy': return <Smile className="text-yellow-400" size={20} />;
      case 'sad': return <Frown className="text-blue-400" size={20} />;
      case 'angry': return <AlertCircle className="text-red-400" size={20} />;
      default: return <Meh className="text-gray-400" size={20} />;
    }
  };

  const getEmotionColor = () => {
    switch (emotion) {
      case 'happy': return 'bg-yellow-500/20 border-yellow-500/50';
      case 'sad': return 'bg-blue-500/20 border-blue-500/50';
      case 'angry': return 'bg-red-500/20 border-red-500/50';
      default: return 'bg-gray-500/20 border-gray-500/50';
    }
  };

  return (
    <div className="glass-panel border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="text-indigo-400" size={18} />
          <span className="text-sm font-semibold text-white">Voice Emotion Detection</span>
        </div>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      </div>

      {isRecording && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-xs text-white/60">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
            <span>Recording... Speak naturally</span>
          </div>

          {transcript && (
            <div className="text-sm text-white/80 bg-white/5 rounded-lg p-2">
              {transcript}
            </div>
          )}

          {emotion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getEmotionColor()}`}
            >
              {getEmotionIcon()}
              <div className="flex-1">
                <div className="text-sm font-medium text-white capitalize">
                  {emotion} ({Math.round(confidence * 100)}% confidence)
                </div>
                <div className="text-xs text-white/60">
                  Detected from voice tone and content
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default VoiceEmotionDetector;
