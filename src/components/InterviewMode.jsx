/**
 * Interview Analysis Engine UI
 * Mock interview mode with real-time feedback
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Square, TrendingUp, AlertCircle, CheckCircle2, XCircle, MessageSquare, Brain } from 'lucide-react';
import { useVoiceMode } from '../hooks/useVoiceMode';
import { generateInterviewerPersona, analyzeResponse, generateNextQuestion } from '../utils/interviewEngine';
import { callAI } from '../utils/aiProvider';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const InterviewMode = ({ onClose }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentRole, setCurrentRole] = useState('Cyber Security Analyst');
  const [questionsAsked, setQuestionsAsked] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [overallScore, setOverallScore] = useState(null);

  // Handle user transcript from voice mode
  const handleUserTranscript = useCallback(async (transcript) => {
    if (!transcript || transcript.trim().length === 0) return;
    if (!currentQuestion) return;

    console.log('🎤 [Interview] Candidate said:', transcript);

    // Add to interview history
    setInterviewHistory(prev => [...prev, {
      question: currentQuestion,
      answer: transcript,
      timestamp: new Date().toISOString()
    }]);

    // Analyze the response
    setIsAnalyzing(true);
    try {
      const analysisResult = await analyzeResponse(transcript, currentQuestion, currentRole);
      
      if (analysisResult.success && analysisResult.analysis) {
        const newFeedbackItem = {
          question: currentQuestion,
          answer: transcript,
          analysis: analysisResult.analysis,
          timestamp: new Date().toISOString()
        };
        
        setFeedback(prev => {
          const updatedFeedback = [...prev, newFeedbackItem];
          
          // Update overall score from updated feedback
          const scores = updatedFeedback
            .map(f => f?.analysis?.score)
            .filter(score => typeof score === 'number' && !isNaN(score));
          
          const avgScore = scores.length > 0 
            ? scores.reduce((a, b) => a + b, 0) / scores.length 
            : (analysisResult.analysis?.score || 0);
          
          setOverallScore(avgScore);
          
          return updatedFeedback;
        });

        // Generate next question
        setIsGeneratingQuestion(true);
        try {
          const nextQuestion = await generateNextQuestion(currentRole, [...questionsAsked, currentQuestion]);
          if (nextQuestion && nextQuestion.trim()) {
            setCurrentQuestion(nextQuestion);
            setQuestionsAsked(prev => [...prev, currentQuestion]);
          } else {
            console.warn('Generated question is empty, using fallback');
            setCurrentQuestion(`Tell me about your experience with ${currentRole} responsibilities.`);
          }
        } catch (questionError) {
          console.error('Error generating next question:', questionError);
          setCurrentQuestion(`Tell me about your experience with ${currentRole} responsibilities.`);
        }
        
        success('Feedback generated! Next question ready.');
      } else {
        showError('Failed to analyze response. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing interview response:', error);
      showError('Error analyzing your answer. Please continue.');
    } finally {
      setIsAnalyzing(false);
      setIsGeneratingQuestion(false);
    }
  }, [currentQuestion, currentRole, questionsAsked, feedback, success, showError]);

  const voiceModeResult = useVoiceMode(handleUserTranscript);
  const {
    isListening = false,
    isSpeaking = false,
    isMuted = false,
    interimTranscript = '',
    error: voiceError = null,
    startVoiceMode,
    stopVoiceMode,
    toggleMute,
    speak: speakText,
    stopSpeaking
  } = voiceModeResult || {};

  // Start interview
  const startInterview = useCallback(async () => {
    setIsInterviewActive(true);
    setIsGeneratingQuestion(true);
    
    try {
      // Start voice mode
      const voiceStarted = await startVoiceMode();
      if (!voiceStarted) {
        showError('Failed to start voice mode. Please check microphone permissions.');
        setIsInterviewActive(false);
        return;
      }

      // Generate first question
      const firstQuestion = await generateNextQuestion(currentRole, []);
      if (firstQuestion && firstQuestion.trim()) {
        setCurrentQuestion(firstQuestion);
        setQuestionsAsked([]);
        setFeedback([]);
        setInterviewHistory([]);
        setOverallScore(null);

        // Speak the question
        if (speakText) {
          speakText(`Let's begin. ${firstQuestion}`);
        }
      } else {
        throw new Error('Failed to generate first question');
      }
      
      success('Interview started! Listen for the first question.');
    } catch (error) {
      console.error('Error starting interview:', error);
      showError('Failed to start interview. Please try again.');
      setIsInterviewActive(false);
    } finally {
      setIsGeneratingQuestion(false);
    }
  }, [currentRole, startVoiceMode, speakText, success, showError]);

  // Stop interview
  const stopInterview = useCallback(() => {
    stopVoiceMode();
    stopSpeaking();
    setIsInterviewActive(false);
    setCurrentQuestion(null);
  }, [stopVoiceMode, stopSpeaking]);

  // Role selection
  const availableRoles = [
    'Cyber Security Analyst',
    'Software Engineer',
    'Data Scientist',
    'DevOps Engineer',
    'Product Manager',
    'UX Designer',
    'Full Stack Developer',
    'Cloud Architect'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex">
      {/* Main Interview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* AI Recruiter Pulse Visualization */}
        <motion.div
          animate={{
            scale: isSpeaking ? [1, 1.1, 1] : 1,
            opacity: isSpeaking ? [0.8, 1, 0.8] : 0.7
          }}
          transition={{
            duration: 1.5,
            repeat: isSpeaking ? Infinity : 0,
            ease: 'easeInOut'
          }}
          className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-2xl flex items-center justify-center mb-8 relative"
        >
          {/* Pulse rings */}
          {isSpeaking && (
            <>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-4 border-red-400"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className="absolute inset-0 rounded-full border-4 border-orange-400"
              />
            </>
          )}
          <Brain className="text-white" size={48} />
        </motion.div>

        {/* Status Text */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {isSpeaking 
              ? 'AI Recruiter Speaking...' 
              : isListening 
                ? 'Listening...' 
                : isInterviewActive 
                  ? 'Interview Active' 
                  : 'Mock Interview Mode'}
          </h2>
          
          {!isInterviewActive && (
            <div className="mt-4">
              <label className="block text-white/80 text-sm mb-2">Select Role:</label>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isInterviewActive}
              >
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          )}

          {currentQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 max-w-2xl mx-auto"
            >
              <div className="flex items-start gap-3 mb-2">
                <MessageSquare className="text-indigo-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm text-indigo-300 mb-1">Question {questionsAsked.length + 1}:</p>
                  <p className="text-white text-lg font-medium">{currentQuestion}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Live Captions */}
          {interimTranscript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 max-w-2xl mx-auto"
            >
              <p className="text-white/80 text-center">{interimTranscript}</p>
            </motion.div>
          )}

          {/* Analysis Status */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-center justify-center gap-2 text-indigo-300"
            >
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing your response...</span>
            </motion.div>
          )}

          {isGeneratingQuestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-center justify-center gap-2 text-purple-300"
            >
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span>Generating next question...</span>
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          {!isInterviewActive ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startInterview}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg"
            >
              <Play size={20} className="inline mr-2" />
              Start Mock Interview
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={`p-4 rounded-full ${
                  isMuted 
                    ? 'bg-red-500/20 border-2 border-red-500' 
                    : 'bg-white/10 border-2 border-white/20'
                } text-white transition-all`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopInterview}
                className="px-6 py-3 bg-red-500/20 border-2 border-red-500 text-white font-semibold rounded-xl transition-all"
              >
                <Square size={20} className="inline mr-2" />
                End Interview
              </motion.button>
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-3 bg-white/10 border-2 border-white/20 text-white font-semibold rounded-xl transition-all"
          >
            Close
          </motion.button>
        </div>

        {/* Overall Score */}
        {overallScore !== null && typeof overallScore === 'number' && !isNaN(overallScore) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl border border-indigo-500/30"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="text-indigo-300" size={24} />
              <div>
                <p className="text-sm text-indigo-300">Overall Score</p>
                <p className="text-3xl font-bold text-white">{overallScore.toFixed(1)}/10</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Live Feedback Sidebar */}
      <div className="w-96 border-l border-white/10 bg-black/40 backdrop-blur-sm overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Live Feedback
          </h3>

          {feedback.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>Feedback will appear here after you answer questions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item, index) => {
                // Defensive check: ensure item and analysis exist
                if (!item || !item.analysis) {
                  return null;
                }
                
                const score = typeof item.analysis.score === 'number' ? item.analysis.score : 0;
                
                return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  {/* Question */}
                  <div className="mb-3">
                    <p className="text-xs text-indigo-300 mb-1">Q{index + 1}:</p>
                    <p className="text-sm text-white font-medium">{item.question || 'Question not available'}</p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${
                      score >= 8 ? 'bg-green-500/20' :
                      score >= 6 ? 'bg-yellow-500/20' :
                      'bg-red-500/20'
                    }`}>
                      {score >= 8 ? (
                        <CheckCircle2 className="text-green-400" size={20} />
                      ) : score >= 6 ? (
                        <AlertCircle className="text-yellow-400" size={20} />
                      ) : (
                        <XCircle className="text-red-400" size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{score}/10</p>
                      <p className="text-xs text-white/60">Overall</p>
                    </div>
                  </div>

                  {/* STAR Method */}
                  {item.analysis.starMethod && (
                    <div className="mb-3 p-2 bg-indigo-500/10 rounded-lg">
                      <p className="text-xs text-indigo-300 mb-1">STAR Method:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className={(item.analysis.starMethod.situation || '').toLowerCase() === 'yes' ? 'text-green-400' : 'text-white/60'}>
                          S: {item.analysis.starMethod.situation || 'N/A'}
                        </div>
                        <div className={(item.analysis.starMethod.task || '').toLowerCase() === 'yes' ? 'text-green-400' : 'text-white/60'}>
                          T: {item.analysis.starMethod.task || 'N/A'}
                        </div>
                        <div className={(item.analysis.starMethod.action || '').toLowerCase() === 'yes' ? 'text-green-400' : 'text-white/60'}>
                          A: {item.analysis.starMethod.action || 'N/A'}
                        </div>
                        <div className={(item.analysis.starMethod.result || '').toLowerCase() === 'yes' ? 'text-green-400' : 'text-white/60'}>
                          R: {item.analysis.starMethod.result || 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Filler Words */}
                  {item.analysis.fillerWords && item.analysis.fillerWords.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-white/60 mb-1">
                        Filler Words: {item.analysis.fillerCount}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.analysis.fillerWords.slice(0, 10).map((word, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvements */}
                  {item.analysis.specificImprovement && (
                    <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-300 mb-1">💡 Improvement:</p>
                      <p className="text-sm text-white">{item.analysis.specificImprovement}</p>
                    </div>
                  )}
                </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewMode;
