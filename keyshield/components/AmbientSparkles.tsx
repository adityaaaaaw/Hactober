'use client';

import React from 'react';

interface SparkleItem {
  id: number;
  top: string;
  left: string;
  size: number;
  color: string;
  delay: string;
  duration: string;
}

// Fixed deterministic positions to avoid SSR hydration mismatches
const SPARKLES: SparkleItem[] = [
  { id: 1, top: '8%', left: '12%', size: 3, color: '#C4B5FD', delay: '0s', duration: '5s' },
  { id: 2, top: '15%', left: '88%', size: 4, color: '#DDD6FE', delay: '1.2s', duration: '6s' },
  { id: 3, top: '24%', left: '4%', size: 3, color: '#818CF8', delay: '2.5s', duration: '4.5s' },
  { id: 4, top: '38%', left: '94%', size: 5, color: '#C4B5FD', delay: '0.8s', duration: '7s' },
  { id: 5, top: '52%', left: '18%', size: 3, color: '#A78BFA', delay: '3.1s', duration: '5.2s' },
  { id: 6, top: '65%', left: '82%', size: 4, color: '#E0E7FF', delay: '1.7s', duration: '6.4s' },
  { id: 7, top: '78%', left: '7%', size: 3, color: '#C4B5FD', delay: '2.2s', duration: '4.8s' },
  { id: 8, top: '85%', left: '91%', size: 4, color: '#818CF8', delay: '0.4s', duration: '5.8s' },
  { id: 9, top: '18%', left: '48%', size: 3, color: '#EDE9FE', delay: '3.6s', duration: '6.2s' },
  { id: 10, top: '72%', left: '42%', size: 3, color: '#C4B5FD', delay: '1.9s', duration: '5.5s' },
  { id: 11, top: '44%', left: '8%', size: 4, color: '#DDD6FE', delay: '2.8s', duration: '6.8s' },
  { id: 12, top: '92%', left: '33%', size: 3, color: '#818CF8', delay: '1.1s', duration: '4.9s' },
];

export const AmbientSparkles: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0 hidden sm:block"
    >
      {SPARKLES.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full anim-twinkle"
          style={{
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            boxShadow: `0 0 ${s.size * 2.5}px ${s.color}`,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}

      {/* Very subtle ambient gradient orbs */}
      <div
        className="absolute top-[10%] left-[20%] w-[380px] h-[380px] rounded-full bg-indigo-400/10 blur-[90px] anim-drift-slow"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="absolute top-[55%] right-[15%] w-[420px] h-[420px] rounded-full bg-purple-300/15 blur-[100px] anim-drift-slow"
        style={{ animationDelay: '-7s' }}
      />
    </div>
  );
};
