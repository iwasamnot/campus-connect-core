import { LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from './Logo';

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
      {/* Fluid Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-br from-indigo-200/30 via-purple-200/20 to-pink-200/30 dark:from-indigo-900/20 dark:via-purple-900/15 dark:to-pink-900/20 blur-3xl"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <div className="text-center w-full max-w-4xl mx-auto">
          {/* Logo - Minimal */}
          <div className="mb-16 flex justify-center">
            <div className="animate-float-slow">
              <Logo size="large" showText={false} />
            </div>
          </div>
          
          {/* Minimal Heading */}
          <div className="mb-12">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-light text-gray-900 dark:text-white mb-4 leading-[1.1] tracking-tight">
              <span className="block font-extralight">Your campus</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-[length:200%_auto] animate-gradient-slow">
                connected
              </span>
            </h1>
          </div>
          
          {/* Minimal Subtitle */}
          <div className="mb-16">
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-light">
              The most intuitive student messaging platform.
            </p>
          </div>
          
          {/* Minimal Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <button
              onClick={onRegister}
              className="group relative flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-base rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 min-w-[200px] justify-center overflow-hidden"
            >
              <UserPlus className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:rotate-12" />
              <span>Register</span>
            </button>
            
            <button
              onClick={onLogin}
              className="group flex items-center gap-3 px-10 py-4 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-base rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 min-w-[200px] justify-center"
            >
              <LogIn className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.8;
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
            opacity: 0.7;
          }
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes gradient-slow {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        
        .animate-gradient-slow {
          animation: gradient-slow 8s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
