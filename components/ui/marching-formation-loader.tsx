'use client';

import { motion } from 'framer-motion';

export function MarchingFormationLoader({ className = '' }: { className?: string }) {
  // 4x4 Grid of "marchers"
  const rows = 4;
  const cols = 4;
  const dots = Array.from({ length: rows * cols });

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div 
        className="grid gap-3" 
        style={{ gridTemplateColumns: `repeat(${cols}, min-content)` }}
      >
        {dots.map((_, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          
          return (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              initial={{ opacity: 0.3, scale: 0.8 }}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
                y: [0, -4, 0] // Slight "step" motion
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: (row + col) * 0.1, // Diagonal wave effect
                ease: "easeInOut"
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

