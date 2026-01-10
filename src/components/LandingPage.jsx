import { LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import { motion } from 'framer-motion';
import { AnimatedButton, SpringButton, FadeIn, SlideIn, ScaleIn, StaggerContainer, StaggerItem, GSAPEntrance } from './AnimatedComponents';
import { gsap } from 'gsap';

const LandingPage = ({ onLogin, onRegister }) => {
  const [particles, setParticles] = useState([]);

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
    <div className="min-h-screen overflow-hidden relative bg-white dark:bg-gray-900">
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
              className="absolute rounded-full bg-gradient-to-br from-indigo-200/30 via-purple-200/20 to-pink-200/30 dark:from-indigo-900/20 dark:via-purple-900/15 dark:to-pink-900/20 blur-3xl"
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
                className="text-6xl sm:text-7xl md:text-8xl font-light text-gray-900 dark:text-white mb-4 leading-[1.1] tracking-tight"
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
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-[length:200%_auto]"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
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
              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-light">
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
                className="flex items-center gap-3 px-10 py-4 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-base rounded-full min-w-[200px] justify-center"
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

    </div>
  );
};

export default LandingPage;
