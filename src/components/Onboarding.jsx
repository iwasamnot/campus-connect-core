/**
 * Onboarding Component
 * Guides new users through key features
 * Modern UX: Interactive, skippable, progressive disclosure
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, MessageSquare, Bot, Users, Settings } from 'lucide-react';

const Onboarding = ({ onComplete, skipOnboarding }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem('onboarding_completed');
    if (!hasCompleted && !skipOnboarding) {
      setShowOnboarding(true);
    }
  }, [skipOnboarding]);

  const steps = [
    {
      title: 'Welcome to CampusConnect',
      description: 'Your all-in-one campus communication platform',
      icon: Sparkles,
      content: 'Connect with students, access AI help, and collaborate seamlessly.',
      image: '✨',
    },
    {
      title: 'Campus Chat',
      description: 'Chat with your entire campus community',
      icon: MessageSquare,
      content: 'Join global discussions, share ideas, and stay connected.',
      image: '💬',
    },
    {
      title: 'AI Help',
      description: 'Get instant answers with AI assistance',
      icon: Bot,
      content: 'Ask questions, get help with assignments, and access campus information.',
      image: '🤖',
    },
    {
      title: 'Groups & Collaboration',
      description: 'Work together with groups',
      icon: Users,
      content: 'Create study groups, join clubs, and collaborate on projects.',
      image: '👥',
    },
    {
      title: 'Customize Your Experience',
      description: 'Make it yours',
      icon: Settings,
      content: 'Adjust settings, personalize your profile, and set preferences.',
      image: '⚙️',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!showOnboarding) return null;

  const current = steps[currentStep];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel border border-white/10 rounded-[2rem] p-8 max-w-md w-full relative"
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-all"
            aria-label="Skip onboarding"
          >
            <X size={20} className="text-white/70" />
          </button>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-indigo-500'
                    : index < currentStep
                    ? 'w-2 bg-indigo-500/50'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="text-6xl mb-4">{current.image}</div>
              <Icon size={48} className="mx-auto mb-4 text-indigo-400" />
              <h2 className="text-2xl font-bold text-white mb-2">{current.title}</h2>
              <p className="text-white/80 mb-4">{current.description}</p>
              <p className="text-white/60 text-sm">{current.content}</p>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <button
              onClick={handleSkip}
              className="px-4 py-2 text-white/60 hover:text-white text-sm transition-all"
            >
              Skip
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Onboarding;
