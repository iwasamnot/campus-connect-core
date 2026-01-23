/**
 * Interview Analysis Engine UI
 * Mock interview mode with real-time feedback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Square, TrendingUp, AlertCircle, CheckCircle2, XCircle, MessageSquare, Brain } from 'lucide-react';
import { useVoiceMode } from '../hooks/useVoiceMode';
import { generateInterviewerPersona, analyzeResponse, generateNextQuestion } from '../utils/interviewEngine';
import { callAI } from '../utils/aiProvider';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const InterviewMode = ({ onClose }) => {
  console.log('🚀 [InterviewMode] Component rendering started');
  
  // ✅ FIX: Use hooks normally - ErrorBoundary will catch any errors
  // Hooks must be called unconditionally (React rules)
  console.log('🔍 [InterviewMode] Calling useAuth hook...');
  const authContext = useAuth();
  console.log('✅ [InterviewMode] useAuth returned:', { 
    hasUser: !!authContext?.user,
    loading: authContext?.loading 
  });
  
  const user = authContext?.user;
  const loading = authContext?.loading ?? false;
  
  console.log('🔍 [InterviewMode] Calling useToast hook...');
  const { success, error: showError } = useToast();
  console.log('✅ [InterviewMode] useToast returned:', { 
    hasSuccess: typeof success === 'function',
    hasShowError: typeof showError === 'function'
  });
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentRole, setCurrentRole] = useState('Cyber Security Analyst');
  const [questionsAsked, setQuestionsAsked] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [overallScore, setOverallScore] = useState(null);
  const [initError, setInitError] = useState(null);
  const feedbackRef = useRef([]); // ✅ FIX: Ref to track feedback for score calculation

  // ✅ FIX: Log all errors (don't suppress - just log them)
  useEffect(() => {
    console.log('🔍 [InterviewMode] Component mounted - setting up error listeners');
    
    const handleError = (event) => {
      const errorMessage = event.message || event.error?.message || '';
      console.log('🚨 [InterviewMode] Global error caught:', {
        message: errorMessage,
        error: event.error,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      
      // Only suppress blob URL errors (they're harmless)
      if (errorMessage.includes('blob:') && errorMessage.includes('ERR_FILE_NOT_FOUND')) {
        console.debug('🔇 [InterviewMode] Suppressed harmless blob URL error');
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      
      // Log all other errors
      console.error('❌ [InterviewMode] Unhandled error:', event.error);
    };

    const handleRejection = (event) => {
      const reason = event.reason?.message || String(event.reason || '');
      console.log('🚨 [InterviewMode] Unhandled promise rejection:', {
        reason: event.reason,
        reasonString: reason
      });
      
      // Only suppress blob URL rejections
      if (reason.includes('blob:') && reason.includes('ERR_FILE_NOT_FOUND')) {
        console.debug('🔇 [InterviewMode] Suppressed harmless blob URL rejection');
        event.preventDefault();
        return;
      }
      
      // Log all other rejections
      console.error('❌ [InterviewMode] Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.log('🔍 [InterviewMode] Component unmounting - removing error listeners');
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // ✅ FIX: Check authentication and log errors
  useEffect(() => {
    console.log('🔍 [InterviewMode] Initializing...', {
      user: user ? { uid: user.uid, email: user.email } : null,
      loading,
      hasAuthContext: !!authContext,
      authContextKeys: authContext ? Object.keys(authContext) : [],
      showErrorType: typeof showError,
      successType: typeof success
    });

    try {
      if (!authContext) {
        const error = new Error('AuthContext is not available. Make sure InterviewMode is wrapped in AuthProvider.');
        console.error('❌ [InterviewMode] AuthContext error:', error);
        setInitError(error.message);
        if (showError) {
          showError('Authentication error. Please refresh the page.');
        } else {
          console.error('❌ [InterviewMode] showError is not available!');
        }
        return;
      }

      if (loading) {
        console.log('⏳ [InterviewMode] Auth is loading...');
        return;
      }

      if (!user) {
        console.warn('⚠️ [InterviewMode] No user authenticated');
        setInitError('Please log in to use Mock Interview.');
        if (showError) {
          showError('Please log in to use Mock Interview.');
        } else {
          console.error('❌ [InterviewMode] showError is not available!');
        }
        return;
      }

      console.log('✅ [InterviewMode] Initialized successfully');
      setInitError(null);
    } catch (error) {
      console.error('❌ [InterviewMode] Error in initialization effect:', error);
      console.error('Error stack:', error?.stack);
      setInitError(`Initialization error: ${error?.message || 'Unknown error'}`);
    }
  }, [user, loading, authContext, showError, success]);

  // Sync ref with state
  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);

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
      console.log('🔍 [InterviewMode] Analyzing response...', {
        transcriptLength: transcript.length,
        question: currentQuestion,
        role: currentRole
      });
      
      const analysisResult = await analyzeResponse(transcript, currentQuestion, currentRole);
      
      console.log('✅ [InterviewMode] Analysis result:', {
        success: analysisResult.success,
        hasAnalysis: !!analysisResult.analysis,
        score: analysisResult.analysis?.score
      });
      
      if (analysisResult.success) {
        // ✅ FIX: Calculate new feedback and score first, then update states sequentially
        // This avoids nested setState calls (React error #426)
        const newFeedbackItem = {
          question: currentQuestion,
          answer: transcript,
          analysis: analysisResult.analysis,
          timestamp: new Date().toISOString()
        };
        
        // Calculate new feedback array and score using ref to get current state
        const newFeedback = [...feedbackRef.current, newFeedbackItem];
        const scores = newFeedback.map(f => f.analysis?.score || 0);
        const avgScore = scores.length > 0 
          ? scores.reduce((a, b) => a + b, 0) / scores.length 
          : analysisResult.analysis.score;
        
        // Update states sequentially, not nested
        setFeedback(newFeedback);
        setOverallScore(avgScore);

        // Generate next question
        setIsGeneratingQuestion(true);
        const nextQuestion = await generateNextQuestion(currentRole, [...questionsAsked, currentQuestion]);
        setCurrentQuestion(nextQuestion);
        setQuestionsAsked(prev => [...prev, currentQuestion]);
        
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
  }, [currentQuestion, currentRole, questionsAsked, success, showError]); // ✅ FIX: Removed feedback from deps to prevent callback recreation

  // ✅ FIX: Log useVoiceMode initialization
  console.log('🎤 [InterviewMode] About to call useVoiceMode hook...');
  const {
    isListening,
    isSpeaking,
    isMuted,
    interimTranscript,
    error: voiceError,
    startVoiceMode,
    stopVoiceMode,
    toggleMute,
    speak: speakText,
    stopSpeaking
  } = useVoiceMode(handleUserTranscript);
  
  console.log('✅ [InterviewMode] useVoiceMode hook called successfully:', {
    isListening,
    isSpeaking,
    isMuted,
    hasStartVoiceMode: typeof startVoiceMode === 'function',
    hasSpeak: typeof speakText === 'function',
    voiceError
  });

  // Start interview
  const startInterview = useCallback(async () => {
    console.log('🚀 [InterviewMode] Starting interview...', {
      role: currentRole,
      user: user ? { uid: user.uid } : null
    });

    // ✅ FIX: Check authentication before starting
    if (!user) {
      const error = 'User not authenticated. Please log in.';
      console.error('❌ [InterviewMode]', error);
      showError(error);
      setInitError(error);
      return;
    }

    setIsInterviewActive(true);
    setIsGeneratingQuestion(true);
    
    try {
      // Start voice mode
      console.log('🎤 [InterviewMode] Starting voice mode...');
      const voiceStarted = await startVoiceMode();
      if (!voiceStarted) {
        const error = 'Failed to start voice mode. Please check microphone permissions.';
        console.error('❌ [InterviewMode]', error);
        showError(error);
        setIsInterviewActive(false);
        return;
      }
      console.log('✅ [InterviewMode] Voice mode started');

      // Generate first question
      console.log('🤖 [InterviewMode] Generating first question...');
      const firstQuestion = await generateNextQuestion(currentRole, []);
      console.log('✅ [InterviewMode] First question generated:', firstQuestion);
      
      setCurrentQuestion(firstQuestion);
      setQuestionsAsked([]);
      setFeedback([]);
      setInterviewHistory([]);
      setOverallScore(null);

      // Speak the question
      console.log('🔊 [InterviewMode] Speaking question...');
      speakText(`Let's begin. ${firstQuestion}`);
      
      success('Interview started! Listen for the first question.');
      console.log('✅ [InterviewMode] Interview started successfully');
    } catch (error) {
      console.error('❌ [InterviewMode] Error starting interview:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        code: error?.code
      });
      showError(`Failed to start interview: ${error?.message || 'Unknown error'}. Please try again.`);
      setIsInterviewActive(false);
    } finally {
      setIsGeneratingQuestion(false);
    }
  }, [currentRole, startVoiceMode, speakText, success, showError, user]);

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

  // ✅ FIX: Show error state if initialization failed
  if (initError) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-panel border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl"
        >
          <div className="flex items-center justify-center mb-6">
            <AlertCircle className="text-red-400" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Authentication Required
          </h2>
          <p className="text-white/70 text-center mb-6">
            {initError}
          </p>
          <div className="flex gap-3">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all"
            >
              Close
            </motion.button>
            <motion.button
              onClick={() => window.location.reload()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl transition-all"
            >
              Refresh Page
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ✅ FIX: Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </motion.div>
      </div>
    );
  }

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
        {overallScore !== null && (
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
              {feedback.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  {/* Question */}
                  <div className="mb-3">
                    <p className="text-xs text-indigo-300 mb-1">Q{index + 1}:</p>
                    <p className="text-sm text-white font-medium">{item.question}</p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${
                      item.analysis.score >= 8 ? 'bg-green-500/20' :
                      item.analysis.score >= 6 ? 'bg-yellow-500/20' :
                      'bg-red-500/20'
                    }`}>
                      {item.analysis.score >= 8 ? (
                        <CheckCircle2 className="text-green-400" size={20} />
                      ) : item.analysis.score >= 6 ? (
                        <AlertCircle className="text-yellow-400" size={20} />
                      ) : (
                        <XCircle className="text-red-400" size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{item.analysis.score}/10</p>
                      <p className="text-xs text-white/60">Overall</p>
                    </div>
                  </div>

                  {/* STAR Method */}
                  {item.analysis.starMethod && (
                    <div className="mb-3 p-2 bg-indigo-500/10 rounded-lg">
                      <p className="text-xs text-indigo-300 mb-1">STAR Method:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className={item.analysis.starMethod.situation === 'yes' ? 'text-green-400' : 'text-white/60'}>
                          S: {item.analysis.starMethod.situation}
                        </div>
                        <div className={item.analysis.starMethod.task === 'yes' ? 'text-green-400' : 'text-white/60'}>
                          T: {item.analysis.starMethod.task}
                        </div>
                        <div className={item.analysis.starMethod.action === 'yes' ? 'text-green-400' : 'text-white/60'}>
                          A: {item.analysis.starMethod.action}
                        </div>
                        <div className={item.analysis.starMethod.result === 'yes' ? 'text-green-400' : 'text-white/60'}>
                          R: {item.analysis.starMethod.result}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewMode;
