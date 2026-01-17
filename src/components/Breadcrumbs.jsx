/**
 * Breadcrumbs Component
 * Provides navigation hierarchy and location context
 * Modern UX: Clickable path, keyboard accessible
 */

import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ items, onNavigate, homeLabel = 'Home' }) => {
  if (!items || items.length === 0) return null;

  const handleClick = (item, index) => {
    if (item.onClick || onNavigate) {
      (item.onClick || onNavigate)?.(item.path || item.label, index);
    }
  };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-4">
      {/* Home */}
      <motion.button
        onClick={() => handleClick({ label: homeLabel, path: '/' }, 0)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex items-center gap-1 px-2 py-1 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        aria-label="Home"
      >
        <Home size={14} />
        <span>{homeLabel}</span>
      </motion.button>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight size={14} className="text-white/40" />
          {index === items.length - 1 ? (
            <span className="text-white font-medium" aria-current="page">
              {item.label}
            </span>
          ) : (
            <motion.button
              onClick={() => handleClick(item, index + 1)}
              whileHover={{ scale: 1.05 }}
              className="px-2 py-1 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              {item.label}
            </motion.button>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
