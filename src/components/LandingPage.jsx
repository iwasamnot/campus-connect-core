import { LogIn, UserPlus } from 'lucide-react';
import Logo from './Logo';

const LandingPage = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/20">
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        <div className="text-center w-full max-w-5xl mx-auto">
          {/* Logo - without text */}
          <div className="mb-10 flex justify-center animate-fade-in">
            <Logo size="large" showText={false} />
          </div>
          
          {/* Dual Heading - Split Text Effect */}
          <div className="mb-6 animate-slide-down-fade">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold text-gray-900 dark:text-white mb-2 leading-[1.1] tracking-tight">
              <span className="block">Your campus</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400">
                connected anywhere
              </span>
            </h1>
          </div>
          
          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto animate-slide-up-fade px-4">
            CampusConnect is the most intuitive student messaging platform. Connect with your campus community from any device.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-zoom-in px-4">
            <button
              onClick={onRegister}
              className="group relative flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl min-w-[220px] justify-center overflow-hidden w-full sm:w-auto"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              <UserPlus className="w-6 h-6 relative z-10 flex-shrink-0" />
              <span className="relative z-10">Register</span>
            </button>
            
            <button
              onClick={onLogin}
              className="group flex items-center gap-3 px-10 py-4 bg-white dark:bg-gray-800 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold text-lg rounded-xl transition-all duration-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-700 dark:hover:border-indigo-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-w-[220px] justify-center w-full sm:w-auto"
            >
              <LogIn className="w-6 h-6 flex-shrink-0" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
