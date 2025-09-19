import React from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  color: string;
  size: number;
  strokeWidth: number;
  isRunning: boolean;
  isPaused: boolean;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  color,
  size,
  strokeWidth,
  isRunning,
  isPaused,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
      
      {/* Progress percentage indicator */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-full px-3 py-1 shadow-lg">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};