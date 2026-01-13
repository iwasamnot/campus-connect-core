import { LogIn, UserPlus, MessageSquare, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import { AnimatePresence, motion } from 'framer-motion';
import { AnimatedButton, SpringButton, FadeIn, SlideIn, ScaleIn, StaggerContainer, StaggerItem, GSAPEntrance } from './AnimatedComponents';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { markOpenSupportLiveChatAfterLogin, setSupportLiveChatDraftMessage } from '../utils/supportLiveChat';

const LandingPage = ({ onLogin, onRegister }) => {
  const [particles, setParticles] = useState([]);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [supportDraft, setSupportDraft] = useState('');
  const { loginAsStudent } = useAuth();
  const { success, error: showError } = useToast();

  useEffect(() => {
    // Generate floating particles
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 10,
      size: 60 + Math.random() * 120,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden relative bg-transparent">
      {/* Fluid Animated Background Particles with Framer Motion */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <GSAPEntrance
            key={particle.id}
            animationType="fadeIn"
            duration={2 + Math.random() * 2}
            delay={particle.delay}
          >
            <motion.div
              className="absolute rounded-full bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-pink-600/20 blur-3xl"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
              }}
              animate={{
                x: [0, 40, -30, 0],
                y: [0, -40, 30, 0],
                scale: [1, 1.15, 0.9, 1],
                opacity: [0.4, 0.7, 0.5, 0.4],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: particle.delay,
              }}
            />
          </GSAPEntrance>
        ))}
      </div>

      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative z-10 safe-area-inset">
        <StaggerContainer className="text-center w-full max-w-4xl mx-auto" staggerDelay={0.15} initialDelay={0.3} style={{
          paddingTop: `max(3rem, env(safe-area-inset-top, 0px) + 1rem)`,
          paddingBottom: `max(3rem, env(safe-area-inset-bottom, 0px) + 1rem)`,
          paddingLeft: `max(1rem, env(safe-area-inset-left, 0px) + 1rem)`,
          paddingRight: `max(1rem, env(safe-area-inset-right, 0px) + 1rem)`
        }}>
          {/* Animated Logo */}
          <StaggerItem>
            <div className="mb-16 flex justify-center">
              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Logo size="large" showText={false} />
              </motion.div>
            </div>
          </StaggerItem>
          
          {/* Animated Heading */}
          <StaggerItem>
            <div className="mb-12">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-6xl sm:text-7xl md:text-8xl font-light text-white mb-4 leading-[1.1] tracking-tight text-glow"
              >
                <motion.span
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="block font-extralight"
                >
                  Your campus
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ 
                    opacity: { duration: 0.8, delay: 0.4 },
                    x: { duration: 0.8, delay: 0.4 },
                    backgroundPosition: {
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto]"
                >
                  connected
                </motion.span>
              </motion.h1>
            </div>
          </StaggerItem>
          
          {/* Animated Subtitle */}
          <StaggerItem>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-16"
            >
              <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto font-light">
                The most intuitive student messaging platform.
              </p>
            </motion.div>
          </StaggerItem>
          
          {/* Animated Action Buttons */}
          <StaggerItem>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
            >
              <AnimatedButton
                onClick={() => setShowSupportChat(true)}
                variant="outline"
                className="flex items-center gap-3 px-10 py-4 bg-transparent border border-white/20 text-white/80 hover:border-indigo-400 hover:text-indigo-300 font-medium text-base rounded-full min-w-[200px] justify-center transition-all duration-300"
              >
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                </motion.div>
                <span>Live Chat</span>
              </AnimatedButton>

              <SpringButton
                onClick={onRegister}
                className="relative flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-base rounded-full min-w-[200px] justify-center overflow-hidden"
              >
                <motion.div
                  animate={{ rotate: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <UserPlus className="w-5 h-5 flex-shrink-0" />
                </motion.div>
                <span>Register</span>
              </SpringButton>
              
              <AnimatedButton
                onClick={onLogin}
                variant="outline"
                className="flex items-center gap-3 px-10 py-4 bg-transparent border border-white/20 text-white/80 hover:border-indigo-400 hover:text-indigo-300 font-medium text-base rounded-full min-w-[200px] justify-center transition-all duration-300"
              >
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <LogIn className="w-5 h-5 flex-shrink-0" />
                </motion.div>
                <span>Login</span>
              </AnimatedButton>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Guest Support Live Chat (chatbox-style modal) */}
      <AnimatePresence>
        {showSupportChat && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSupportChat(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="glass-panel shadow-2xl border border-white/10 rounded-[2rem] w-full max-w-lg overflow-hidden backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-panel border-b border-white/10 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Logo size="small" showText={false} />
                  <div>
                    <h3 className="text-base font-semibold text-white text-glow">Support Live Chat</h3>
                    <p className="text-xs text-white/60">Chat with an admin — no registration required</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowSupportChat(false)}
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
                  aria-label="Close support chat"
                  type="button"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="p-5 space-y-3 max-h-[55vh] overflow-y-auto">
                <div className="flex justify-start">
                  <div className="glass-panel border border-white/10 bg-white/5 rounded-2xl px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-white/90 leading-relaxed">
                      Hi! Type your message and tap “Start Guest Chat”. We’ll connect you to an admin.
                    </p>
                    <p className="text-[11px] text-white/50 mt-2">Admin Support</p>
                  </div>
                </div>

                {supportDraft.trim() && (
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white rounded-2xl px-4 py-3 max-w-[85%] shadow-lg">
                      <p className="text-sm whitespace-pre-wrap break-words">{supportDraft.trim()}</p>
                      <p className="text-[11px] text-white/70 mt-2 text-right">You</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-panel border-t border-white/10 p-5">
                <div className="flex gap-2">
                  <label htmlFor="landing-support-livechat-input" className="sr-only">Type your message</label>
                  <input
                    id="landing-support-livechat-input"
                    name="landing-support-livechat-input"
                    type="text"
                    value={supportDraft}
                    onChange={(e) => setSupportDraft(e.target.value)}
                    placeholder="Type your message…"
                    className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
                  />
                  <motion.button
                    type="button"
                    onClick={async () => {
                      try {
                        setSupportLiveChatDraftMessage(supportDraft);
                        markOpenSupportLiveChatAfterLogin();
                        setShowSupportChat(false);
                        await loginAsStudent(); // anonymous/guest
                        success('Connecting you to an admin…');
                      } catch (err) {
                        console.error('Guest live chat sign-in failed:', err);
                        showError('Failed to start guest chat. Please try again.');
                      }
                    }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="send-button-shimmer px-4 py-2.5 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    <span className="hidden sm:inline">Start Guest Chat</span>
                    <span className="sm:hidden">Start</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LandingPage;
