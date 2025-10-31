import React from 'react';
import { cn } from '../../utils/cn';

interface CountdownDisplayProps {
  time: string;
  isRunning: boolean;
  isPaused: boolean;
  color: string;
  className?: string;
}

export const CountdownDisplay: React.FC<CountdownDisplayProps> = React.memo(({
  time,
  isRunning,
  isPaused,
  color,
  className,
}) => {
  return (
    <div className={cn('text-center w-full h-full flex flex-col items-center justify-center', className)}>
      {/* Timer Display Container with proper constraints */}
      <div
        className="relative flex items-center justify-center w-full max-w-[280px] h-[120px] px-4"
        style={{
          // Ensure timer fits within the progress ring with proper padding
          maxWidth: '280px', // 320px ring - 20px padding on each side
        }}
      >
        <div
          className={cn(
            'font-mono font-bold transition-all duration-300',
            'leading-none text-center overflow-hidden',
            // Responsive font sizing using CSS clamp() for fluid scaling
            'tabular-nums', // Ensure consistent character width for numbers
            {
              'text-gray-800 dark:text-gray-200': !isRunning,
              'animate-pulse': isPaused,
            }
          )}
          style={{
            // Fluid font size that scales properly within container
            fontSize: 'clamp(3rem, 8vw, 5.5rem)', // Min 48px, scales with viewport, max 88px
            color: isRunning ? color : undefined,
            textShadow: isRunning ? `0 0 20px ${color}40` : undefined,
            // Ensure text fits container width
            maxWidth: '100%',
            // Prevent text overflow and layout shifts
            whiteSpace: 'nowrap',
          }}
        >
          {time}
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="mt-4">
        {isRunning && !isPaused && (
          <div className="flex items-center justify-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: color }}
            />
            <span className="text-lg font-medium" style={{ color }}>
              Focus Time
            </span>
          </div>
        )}
        
        {isRunning && isPaused && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-lg font-medium text-yellow-600 dark:text-yellow-400">
              Paused
            </span>
          </div>
        )}
        
        {!isRunning && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
            <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
              Ready
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

CountdownDisplay.displayName = 'CountdownDisplay';