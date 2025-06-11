'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FireworksProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number;
  title?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Firework {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  exploded: boolean;
  particles: Particle[];
  color: string;
}

const Fireworks: React.FC<FireworksProps> = ({ show, onComplete, duration = 3000, title = "¡Meta Completada!" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const fireworksRef = useRef<Firework[]>([]);
  const startTimeRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(false);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ];

  const createFirework = (canvas: HTMLCanvasElement): Firework => {
    const startX = Math.random() * canvas.width;
    const targetY = canvas.height * 0.2 + Math.random() * canvas.height * 0.3;
    
    return {
      x: startX,
      y: canvas.height,
      targetY,
      vx: (Math.random() - 0.5) * 2,
      vy: -8 - Math.random() * 4,
      exploded: false,
      particles: [],
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  };

  const createParticles = (firework: Firework): Particle[] => {
    const particles: Particle[] = [];
    const particleCount = 25 + Math.random() * 25;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 2 + Math.random() * 6;
      
      particles.push({
        x: firework.x,
        y: firework.y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 60 + Math.random() * 60,
        maxLife: 60 + Math.random() * 60,
        color: firework.color,
        size: 2 + Math.random() * 3
      });
    }
    
    return particles;
  };

  const updateFirework = (firework: Firework): boolean => {
    if (!firework.exploded) {
      firework.x += firework.vx;
      firework.y += firework.vy;
      firework.vy += 0.1; // gravity
      
      // Check if firework should explode
      if (firework.y <= firework.targetY || firework.vy >= 0) {
        firework.exploded = true;
        firework.particles = createParticles(firework);
      }
      
      return true;
    } else {
      // Update particles
      let hasAliveParticles = false;
      
      firework.particles.forEach(particle => {
        if (particle.life > 0) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.05; // gravity
          particle.vx *= 0.99; // air resistance
          particle.life--;
          hasAliveParticles = true;
        }
      });
      
      return hasAliveParticles;
    }
  };

  const drawFirework = (ctx: CanvasRenderingContext2D, firework: Firework) => {
    if (!firework.exploded) {
      // Draw rocket
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = firework.color;
      ctx.beginPath();
      ctx.arc(firework.x, firework.y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw trail
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(firework.x, firework.y + 10, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Draw particles
      firework.particles.forEach(particle => {
        if (particle.life > 0) {
          ctx.save();
          const alpha = particle.life / particle.maxLife;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    }
  };

  const animate = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - startTimeRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add new fireworks periodically
    if (elapsed < duration && Math.random() < 0.03) {
      fireworksRef.current.push(createFirework(canvas));
    }
    
    // Update and draw fireworks
    fireworksRef.current = fireworksRef.current.filter(firework => {
      const isAlive = updateFirework(firework);
      if (isAlive) {
        drawFirework(ctx, firework);
      }
      return isAlive;
    });
    
    // Continue animation
    if (elapsed < duration || fireworksRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 500); // Delay to allow fade out
      }
    }
  };

  const startAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Reset canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Reset state
    fireworksRef.current = [];
    startTimeRef.current = 0;
    setIsVisible(true);
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    fireworksRef.current = [];
    setIsVisible(false);
  };

  useEffect(() => {
    if (show) {
      startAnimation();
    } else {
      stopAnimation();
    }
    
    return () => stopAnimation();
  }, [show]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && isVisible) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible]);

  if (!show && !isVisible) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Celebratory message */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-1000 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-yellow-200">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Felicitaciones!</h2>
          <p className="text-lg text-gray-600">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default Fireworks;
