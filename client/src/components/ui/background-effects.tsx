import { useState, useEffect } from 'react';

// Background Components
export const GridBackground = () => (
  <div className="fixed inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-[#030303] to-[#050508]" />
    <div className="absolute inset-0" style={{
      backgroundImage: `
        linear-gradient(90deg, rgba(147, 51, 234, 0.12) 1px, transparent 1px),
        linear-gradient(0deg, rgba(147, 51, 234, 0.12) 1px, transparent 1px),
        linear-gradient(90deg, rgba(147, 51, 234, 0.08) 1px, transparent 1px),
        linear-gradient(0deg, rgba(147, 51, 234, 0.08) 1px, transparent 1px)
      `,
      backgroundSize: '32px 32px, 32px 32px, 8px 8px, 8px 8px'
    }} />
  </div>
);

// Animated Lines Effect
export const ScrollLines = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Left side lines */}
      <div className="absolute left-16 top-0 bottom-0 w-px opacity-20">
        {[...Array(5)].map((_, i) => (
          <div
            key={`left-${i}`}
            className="absolute w-full h-32 bg-gradient-to-b from-transparent via-purple-500 to-transparent"
            style={{
              top: `${((scrollY * (0.5 + i * 0.1)) % 500) - 100}px`,
              opacity: 0.5 - i * 0.1,
              transition: 'top 0.1s linear'
            }}
          />
        ))}
      </div>

      {/* Right side lines */}
      <div className="absolute right-16 top-0 bottom-0 w-px opacity-20">
        {[...Array(5)].map((_, i) => (
          <div
            key={`right-${i}`}
            className="absolute w-full h-32 bg-gradient-to-b from-transparent via-purple-500 to-transparent"
            style={{
              bottom: `${((scrollY * (0.5 + i * 0.1)) % 500) - 100}px`,
              opacity: 0.5 - i * 0.1,
              transition: 'bottom 0.1s linear'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Floating Particles
export const FloatingParticles = () => (
  <div className="fixed inset-0 pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-purple-500/30"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animation: `float ${5 + Math.random() * 5}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`
        }}
      />
    ))}
  </div>
);
