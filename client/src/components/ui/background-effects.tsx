import React from 'react';

export const GridBackground: React.FC = () => (
  <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] opacity-20" />
);

export const ScrollLines: React.FC = () => (
  <div className="absolute inset-0 bg-scroll-lines opacity-10" />
);

export const FloatingParticles: React.FC = () => (
  <div className="absolute inset-0">
    <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 to-transparent opacity-20" />
  </div>
);
