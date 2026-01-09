import { useState } from 'react';
import { MessageSquare, Users, Shield, Zap, Smartphone, Globe, ArrowRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

const LandingPage = ({ onGetStarted }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="medium" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">CampusConnect</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              Login
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold">
            We Just Launched Our Free Beta Version
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            <span className="block">Your campus</span>
            <span className="block text-indigo-600 dark:text-indigo-400">connected anywhere</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            CampusConnect is the most intuitive student messaging platform there is. Within minutes you can connect with your campus community from any device.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-bold text-lg rounded-lg transition-all duration-300 hover:border-indigo-600 dark:hover:border-indigo-400"
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Simple</h3>
              <p className="text-gray-600 dark:text-gray-400">
                CampusConnect is the most intuitive student messaging platform there is. Within minutes you can start connecting with your campus community.
              </p>
            </div>

            <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">From Any Device</h3>
              <p className="text-gray-600 dark:text-gray-400">
                CampusConnect works flawlessly on smartphones, tablets, and laptops. Access your campus community from anywhere, anytime.
              </p>
            </div>

            <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Secure</h3>
              <p className="text-gray-600 dark:text-gray-400">
                CampusConnect utilizes end-to-end encryption and AI-powered content moderation to keep your conversations safe and secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 dark:text-white mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  01
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Your Account</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Sign up with your student email address. Verification is quick and secure, ensuring only verified students can access the platform.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  02
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Start Connecting</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Once verified, you can join groups, start private conversations, and connect with your campus community through real-time messaging.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl p-8 h-64 flex items-center justify-center">
              <div className="text-center">
                <Globe className="w-24 h-24 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                <p className="text-gray-700 dark:text-gray-300 font-semibold">Access from anywhere</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Everything You Need
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Group Messaging', desc: 'Create and join groups for classes, clubs, and activities' },
              { icon: MessageSquare, title: 'Private Chats', desc: 'One-on-one conversations with fellow students' },
              { icon: Zap, title: 'Real-time Updates', desc: 'Instant notifications and live message delivery' },
              { icon: Shield, title: 'AI Moderation', desc: 'Smart content filtering keeps conversations safe' },
              { icon: Smartphone, title: 'Cross-platform', desc: 'Works on web, iOS, and Android devices' },
              { icon: Globe, title: 'Always Available', desc: 'Access your messages from anywhere in the world' },
            ].map((feature, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <feature.icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Connect?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Join your campus community today and start connecting with students, groups, and more.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 sm:px-8 lg:px-12 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            CampusConnect is in <span className="font-semibold text-indigo-600 dark:text-indigo-400">FREE</span> public Beta.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            All Rights Reserved to CampusConnect {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogin(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Login</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Click "Get Started" to create an account or login with your existing credentials.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowLogin(false);
                  onGetStarted();
                }}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Continue to Login
              </button>
              <button
                onClick={() => setShowLogin(false)}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

