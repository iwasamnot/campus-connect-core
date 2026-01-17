import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { getProviderInfo, getAIProvider } from '../utils/aiProvider';

/**
 * AI Provider Status Component
 * Shows current AI provider and setup instructions
 */
const AIProviderStatus = () => {
  const [providerInfo, setProviderInfo] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const info = getProviderInfo();
    const cfg = getAIProvider();
    setProviderInfo(info);
    setConfig(cfg);
  }, []);

  if (!providerInfo) return null;

  const getStatusColor = () => {
    if (providerInfo.status === 'active') return 'text-green-400';
    if (providerInfo.status === 'not_configured') return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = () => {
    if (providerInfo.status === 'active') return <CheckCircle className="text-green-400" size={20} />;
    if (providerInfo.status === 'not_configured') return <AlertCircle className="text-yellow-400" size={20} />;
    return <XCircle className="text-red-400" size={20} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel border border-white/10 rounded-xl p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="text-indigo-400" size={18} />
          <h3 className="text-sm font-semibold text-white">AI Provider Status</h3>
        </div>
        {getStatusIcon()}
      </div>

      {providerInfo.provider !== 'none' ? (
        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium text-white mb-1">{providerInfo.name}</div>
            <div className="text-xs text-white/60">{providerInfo.limits}</div>
          </div>
          {config && (
            <div className="text-xs text-white/40">
              Model: {config.model}
            </div>
          )}
          {providerInfo.website && (
            <a
              href={providerInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink size={12} />
              Provider Dashboard
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-white/70">
            No AI provider configured. Add an API key to enable AI features.
          </p>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-white/80 mb-2">Recommended for Students:</div>
            <a
              href="https://console.groq.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-indigo-600/20 border border-indigo-500/50 rounded-lg hover:bg-indigo-600/30 transition-colors text-sm text-white"
            >
              <Zap size={16} />
              <div className="flex-1">
                <div className="font-medium">Groq (Free - 14,400 requests/day)</div>
                <div className="text-xs text-white/60">Best for students - very generous limits</div>
              </div>
              <ExternalLink size={14} />
            </a>
          </div>
          <div className="text-xs text-white/60 mt-3">
            See <code className="bg-white/10 px-1 rounded">AI_PROVIDER_SETUP.md</code> for setup instructions
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AIProviderStatus;
