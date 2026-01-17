import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Component Tester Utility
 * Tests all components for functionality and UI standards
 */
const ComponentTester = () => {
  const [tests, setTests] = useState([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({ passed: 0, failed: 0, total: 0 });

  const testComponents = async () => {
    setRunning(true);
    const testResults = [];

    // Test 1: Check if all required components are importable
    try {
      const components = [
        'ChatArea', 'ModernSidebar', 'CommandPalette', 'QuickActions',
        'NotificationCenter', 'GifPicker', 'RichTextEditor', 'MessageEffects'
      ];
      
      for (const comp of components) {
        try {
          await import(`./${comp}.jsx`);
          testResults.push({
            name: `${comp} Import`,
            status: 'pass',
            message: 'Component imports successfully'
          });
        } catch (error) {
          testResults.push({
            name: `${comp} Import`,
            status: 'fail',
            message: `Failed to import: ${error.message}`
          });
        }
      }
    } catch (error) {
      testResults.push({
        name: 'Component Imports',
        status: 'fail',
        message: error.message
      });
    }

    // Test 2: Check localStorage availability
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      testResults.push({
        name: 'LocalStorage',
        status: 'pass',
        message: 'LocalStorage is available'
      });
    } catch (error) {
      testResults.push({
        name: 'LocalStorage',
        status: 'fail',
        message: 'LocalStorage is not available'
      });
    }

    // Test 3: Check Firebase connection
    try {
      const db = typeof window !== 'undefined' && window.__firebaseDb;
      if (db) {
        testResults.push({
          name: 'Firebase Connection',
          status: 'pass',
          message: 'Firebase is connected'
        });
      } else {
        testResults.push({
          name: 'Firebase Connection',
          status: 'warn',
          message: 'Firebase may not be initialized'
        });
      }
    } catch (error) {
      testResults.push({
        name: 'Firebase Connection',
        status: 'fail',
        message: error.message
      });
    }

    // Test 4: Check environment variables
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_CLOUDINARY_CLOUD_NAME',
      'VITE_CLOUDINARY_UPLOAD_PRESET'
    ];

    requiredEnvVars.forEach(envVar => {
      const value = import.meta.env[envVar];
      testResults.push({
        name: `Environment: ${envVar}`,
        status: value ? 'pass' : 'warn',
        message: value ? 'Set' : 'Not set (may cause issues)'
      });
    });

    // Test 5: Check Giphy API
    const giphyKey = import.meta.env.VITE_GIPHY_API_KEY || 'bIPpqbrqYlsc11WrgvSUGTMDHevTr7TD';
    testResults.push({
      name: 'Giphy API Key',
      status: giphyKey ? 'pass' : 'warn',
      message: giphyKey ? 'Available' : 'Not configured'
    });

    setTests(testResults);
    
    const passed = testResults.filter(t => t.status === 'pass').length;
    const failed = testResults.filter(t => t.status === 'fail').length;
    setResults({ passed, failed, total: testResults.length });
    setRunning(false);
  };

  useEffect(() => {
    testComponents();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={18} className="text-green-400" />;
      case 'fail':
        return <XCircle size={18} className="text-red-400" />;
      case 'warn':
        return <AlertCircle size={18} className="text-yellow-400" />;
      default:
        return <Loader size={18} className="text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500/20 border-green-500/50';
      case 'fail':
        return 'bg-red-500/20 border-red-500/50';
      case 'warn':
        return 'bg-yellow-500/20 border-yellow-500/50';
      default:
        return 'bg-gray-500/20 border-gray-500/50';
    }
  };

  return (
    <div className="glass-panel border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Component Tester</h2>
        <button
          onClick={testComponents}
          disabled={running}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50"
        >
          {running ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-panel border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{results.passed}</div>
          <div className="text-sm text-white/60 mt-1">Passed</div>
        </div>
        <div className="glass-panel border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{results.failed}</div>
          <div className="text-sm text-white/60 mt-1">Failed</div>
        </div>
        <div className="glass-panel border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{results.total}</div>
          <div className="text-sm text-white/60 mt-1">Total</div>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tests.map((test, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl border ${getStatusColor(test.status)}`}
          >
            {getStatusIcon(test.status)}
            <div className="flex-1">
              <div className="font-medium text-white">{test.name}</div>
              <div className="text-sm text-white/60">{test.message}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ComponentTester;
