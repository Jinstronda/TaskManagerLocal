import React, { useMemo } from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  color: string;
  size: number;
  strokeWidth: number;
  isRunning: boolean;
  isPaused: boolean;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = React.memo(({
  progress,
  color,
  size,
  strokeWidth,
  isRunning,
  isPaused,
  className,
}) => {
  // Memoize calculations to prevent re-computation on every render
  const { radius, circumference, strokeDasharray, strokeDashoffset } = useMemo(() => {
    const r = (size - strokeWidth) / 2;
    const c = r * 2 * Math.PI;
    return {
      radius: r,
      circumference: c,
      strokeDasharray: c,
      strokeDashoffset: c - (progress / 100) * c
    };
  }, [size, strokeWidth, progress]);

  return (
    <div className={className}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 transition-all duration-300"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-in-out ${
            isPaused ? 'animate-pulse' : ''
          }`}
          style={{
            filter: isRunning ? `drop-shadow(0 0 8px ${color}60)` : undefined,
          }}
        />
        
        {/* Animated glow effect when running */}
        {isRunning && !isPaused && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth / 2}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="animate-pulse opacity-50"
          />
        )}
      </svg>
    </div>
  );
});

ProgressRing.displayName = 'ProgressRing';