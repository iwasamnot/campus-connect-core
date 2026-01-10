import { useState, useEffect } from 'react';

const FluidBackground = ({ particleCount = 8, intensity = 'subtle' }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const opacity = intensity === 'subtle' ? 0.15 : 0.25;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 12 + Math.random() * 8,
      size: 80 + Math.random() * 100,
      opacity,
    }));
    setParticles(newParticles);
  }, [particleCount, intensity]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/20 blur-3xl"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animation: `float-particles ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-particles {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          33% {
            transform: translate(20px, -20px) scale(1.05);
            opacity: 0.6;
          }
          66% {
            transform: translate(-15px, 15px) scale(0.95);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default FluidBackground;

