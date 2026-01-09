import { LogIn, UserPlus } from 'lucide-react';
import Logo from './Logo';

const LandingPage = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center px-6">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size="large" />
        </div>
        
        {/* CampusConnect Text */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-12">
          CampusConnect
        </h1>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onRegister}
            className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-w-[200px] justify-center"
          >
            <UserPlus className="w-6 h-6" />
            <span>Register</span>
          </button>
          
          <button
            onClick={onLogin}
            className="group flex items-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold text-lg rounded-lg transition-all duration-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transform hover:scale-105 active:scale-95 min-w-[200px] justify-center"
          >
            <LogIn className="w-6 h-6" />
            <span>Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
