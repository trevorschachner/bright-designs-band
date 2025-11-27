'use client';

import { motion } from 'framer-motion';

interface WaveformProps {
  isPlaying: boolean;
  className?: string;
  barColor?: string;
}

export function Waveform({ isPlaying, className = '', barColor = 'currentColor' }: WaveformProps) {
  return (
    <div className={`flex items-center gap-[2px] h-4 ${className}`}>
      {[1, 2, 3, 4].map((bar) => (
        <motion.div
          key={bar}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: barColor }}
          animate={{
            height: isPlaying ? [4, 12, 4] : 4,
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: bar * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

