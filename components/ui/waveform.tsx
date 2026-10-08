interface WaveformProps {
  isPlaying: boolean;
  className?: string;
  barColor?: string;
}

// Four bars bouncing between 4px and 12px (CSS keyframes in globals.css).
export function Waveform({ isPlaying, className = '', barColor = 'currentColor' }: WaveformProps) {
  return (
    <div className={`flex items-center gap-[2px] h-4 ${className}`}>
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`w-[3px] h-1 rounded-full${isPlaying ? ' waveform-bar' : ''}`}
          style={{ backgroundColor: barColor, animationDelay: `${bar * 0.1}s` }}
        />
      ))}
    </div>
  );
}
