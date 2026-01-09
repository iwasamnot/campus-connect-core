import { LogIn, UserPlus, Sparkles } from 'lucide-react';
import Logo from './Logo';

const LandingPage = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen overflow-y-auto relative bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/50 dark:from-gray-900 dark:via-indigo-950/30 dark:to-purple-950/30">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <div className="text-center w-full max-w-6xl mx-auto">
          {/* Logo - with glassmorphism effect */}
          <div className="mb-12 flex justify-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-2xl">
                <Logo size="large" showText={false} />
              </div>
            </div>
          </div>
          
          {/* Dual Heading - Modern Split Text with Enhanced Effects */}
          <div className="mb-8 animate-slide-down-fade">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-gray-900 dark:text-white mb-3 leading-[1.05] tracking-tight">
              <span className="block drop-shadow-lg">Your campus</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:via-pink-400 dark:to-indigo-400 bg-[length:200%_auto] animate-gradient">
                connected anywhere
              </span>
            </h1>
          </div>
          
          {/* Enhanced Subtitle with Icon */}
          <div className="mb-14 animate-slide-up-fade">
            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto px-4 font-medium leading-relaxed">
              CampusConnect is the most intuitive student messaging platform. 
              <span className="block mt-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                Connect with your campus community from any device.
              </span>
            </p>
          </div>
          
          {/* Modern Action Buttons with Enhanced Effects */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-zoom-in px-4">
            <button
              onClick={onRegister}
              className="group relative flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-2xl transition-all duration-500 transform hover:scale-110 active:scale-95 shadow-2xl hover:shadow-indigo-500/50 min-w-[240px] justify-center overflow-hidden w-full sm:w-auto"
            >
              {/* Animated gradient overlay */}
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></span>
              {/* Sparkle effect */}
              <Sparkles className="w-5 h-5 relative z-10 flex-shrink-0 opacity-80 group-hover:opacity-100 group-hover:animate-spin" />
              <UserPlus className="w-6 h-6 relative z-10 flex-shrink-0" />
              <span className="relative z-10">Register</span>
              {/* Glow effect */}
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></span>
            </button>
            
            <button
              onClick={onLogin}
              className="group relative flex items-center gap-3 px-12 py-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-indigo-600/50 dark:border-indigo-400/50 text-indigo-600 dark:text-indigo-400 font-bold text-lg rounded-2xl transition-all duration-500 hover:bg-white dark:hover:bg-gray-800 hover:border-indigo-600 dark:hover:border-indigo-400 hover:shadow-2xl transform hover:scale-110 active:scale-95 shadow-xl min-w-[240px] justify-center w-full sm:w-auto"
            >
              <LogIn className="w-6 h-6 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
              <span>Login</span>
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="mt-16 flex justify-center gap-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-indigo-400/60 dark:bg-indigo-500/60 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Add gradient animation keyframes via style tag */}
      <style>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
