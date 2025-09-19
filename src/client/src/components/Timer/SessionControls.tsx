import React, { useEffect } from 'react';
import { Play, Pause, Square, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SessionControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canStop: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onComplete: () => void;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  isRunning,
  isPaused,
  canStart,
  canPause,
  canResume,
  canStop,
  onStart,
  onPause,
  onResume,
  onStop,
  onComplete,
}) => {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (canStart) {
            onStart();
          } else if (canPause) {
            onPause();
          } else if (canResume) {
            onResume();
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (canStop) {
            onStop();
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (isRunning) {
            onComplete();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canStart, canPause, canResume, canStop, isRunning, onStart, onPause, onResume, onStop, onComplete]);

  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Primary Action Button */}
      {canStart && (
        <button
          onClick={onStart}
          className={cn(
            'flex items-center justify-center w-16 h-16 rounded-full',
            'bg-green-500 hover:bg-green-600 text-white',
            'shadow-lg hover:shadow-xl transform hover:scale-105',
            'transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300',
            'group'
          )}
          title="Start session (Space)"
        >
          <Play className="w-8 h-8 ml-1 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {canPause && (
        <button
          onClick={onPause}
          className={cn(
            'flex items-center justify-center w-16 h-16 rounded-full',
            'bg-yellow-500 hover:bg-yellow-600 text-white',
            'shadow-lg hover:shadow-xl transform hover:scale-105',
            'transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-300',
            'group'
          )}
          title="Pause session (Space)"
        >
          <Pause className="w-8 h-8 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {canResume && (
        <button
          onClick={onResume}
          className={cn(
            'flex items-center justify-center w-16 h-16 rounded-full',
            'bg-blue-500 hover:bg-blue-600 text-white',
            'shadow-lg hover:shadow-xl transform hover:scale-105',
            'transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300',
            'group'
          )}
          title="Resume session (Space)"
        >
          <Play className="w-8 h-8 ml-1 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Secondary Action Buttons */}
      {canStop && (
        <button
          onClick={onStop}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full',
            'bg-red-500 hover:bg-red-600 text-white',
            'shadow-md hover:shadow-lg transform hover:scale-105',
            'transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300',
            'group'
          )}
          title="Stop session (Esc)"
        >
          <Square className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {isRunning && (
        <button
          onClick={onComplete}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full',
            'bg-emerald-500 hover:bg-emerald-600 text-white',
            'shadow-md hover:shadow-lg transform hover:scale-105',
            'transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-300',
            'group'
          )}
          title="Complete session (Enter)"
        >
          <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
};