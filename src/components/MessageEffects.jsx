import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Message Effects Component
 * Adds fun animations to messages (confetti, fireworks, etc.)
 */
const MessageEffects = ({ effect, onComplete }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!effect || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationId;
    let particles = [];

    const createParticle = (x, y, type) => {
      if (type === 'confetti') {
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * -3 - 2,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          type: 'confetti'
        };
      } else if (type === 'firework') {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        return {
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: `hsl(${Math.random() * 60 + 15}, 100%, 60%)`,
          size: Math.random() * 4 + 2,
          life: 1,
          type: 'firework'
        };
      } else if (type === 'celebration') {
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * -5 - 3,
          color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'][Math.floor(Math.random() * 5)],
          size: Math.random() * 10 + 5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15,
          type: 'celebration'
        };
      }
      return null;
    };

    // Initialize particles based on effect type
    if (effect === 'confetti') {
      for (let i = 0; i < 100; i++) {
        particles.push(createParticle(
          canvas.width / 2,
          canvas.height / 2,
          'confetti'
        ));
      }
    } else if (effect === 'firework') {
      for (let i = 0; i < 50; i++) {
        particles.push(createParticle(
          canvas.width / 2,
          canvas.height / 2,
          'firework'
        ));
      }
    } else if (effect === 'celebration') {
      for (let i = 0; i < 150; i++) {
        particles.push(createParticle(
          canvas.width / 2,
          canvas.height / 2,
          'celebration'
        ));
      }
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles = particles.filter(particle => {
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // Gravity

        if (particle.rotation !== undefined) {
          particle.rotation += particle.rotationSpeed;
        }

        if (particle.life !== undefined) {
          particle.life -= 0.02;
        }

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        if (particle.rotation !== undefined) {
          ctx.rotate((particle.rotation * Math.PI) / 180);
        }

        if (particle.type === 'confetti' || particle.type === 'celebration') {
          ctx.fillStyle = particle.color;
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        } else if (particle.type === 'firework') {
          ctx.globalAlpha = particle.life;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Keep particle if still visible
        return particle.y < canvas.height + 50 && 
               particle.x > -50 && 
               particle.x < canvas.width + 50 &&
               (particle.life === undefined || particle.life > 0);
      });

      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [effect, onComplete]);

  if (!effect) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default MessageEffects;
