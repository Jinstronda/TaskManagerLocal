import React, { useState, useEffect } from 'react';
import { Sparkles, Sun, Moon, Coffee, Zap, Heart } from 'lucide-react';

interface TransitionAnimationProps {
  type: 'session_start' | 'session_end' | 'break_start' | 'break_end' | 'task_complete';
  isVisible: boolean;
  onComplete: () => void;
  duration?: number; // milliseconds
  message?: string;
}

/**
 * Transition animations component for mindful session transitions
 * Provides calming visual cues between different states
 */
const TransitionAnimations: React.FC<TransitionAnimationProps> = ({
  type,
  isVisible,
  onComplete,
  duration = 3000,
  message,
}) => {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'display' | 'exit'>('enter');
  const [progress, setProgress] = useState(0);

  // Animation configuration based on type
  const getAnimationConfig = () => {
    switch (type) {
      case 'session_start':
        return {
          icon: Sun,
          color: 'from-yellow-400 to-orange-500',
          bgColor: 'from-yellow-50 to-orange-50',
          title: 'Focus Session Starting',
          defaultMessage: 'Take a deep breath and prepare to focus',
          particles: '✨',
          animation: 'sunrise',
        };
      case 'session_end':
        return {
          icon: Sparkles,
          color: 'from-green-400 to-blue-500',
          bgColor: 'from-green-50 to-blue-50',
          title: 'Session Complete',
          defaultMessage: 'Well done! Take a moment to appreciate your progress',
          particles: '🌟',
          animation: 'celebration',
        };
      case 'break_start':
        return {
          icon: Coffee,
          color: 'from-purple-400 to-pink-500',
          bgColor: 'from-purple-50 to-pink-50',
          title: 'Break Time',
          defaultMessage: 'Relax and recharge your energy',
          particles: '☕',
          animation: 'gentle-wave',
        };
      case 'break_end':
        return {
          icon: Zap,
          color: 'from-blue-400 to-cyan-500',
          bgColor: 'from-blue-50 to-cyan-50',
          title: 'Break Complete',
          defaultMessage: 'Ready to return to focused work',
          particles: '⚡',
          animation: 'energy-pulse',
        };
      case 'task_complete':
        return {
          icon: Heart,
          color: 'from-red-400 to-pink-500',
          bgColor: 'from-red-50 to-pink-50',
          title: 'Task Completed',
          defaultMessage: 'Excellent work! Your dedication is paying off',
          particles: '💖',
          animation: 'heart-pulse',
        };
      default:
        return {
          icon: Moon,
          color: 'from-indigo-400 to-purple-500',
          bgColor: 'from-indigo-50 to-purple-50',
          title: 'Transition',
          defaultMessage: 'Taking a mindful moment',
          particles: '🌙',
          animation: 'gentle-fade',
        };
    }
  };

  const config = getAnimationConfig();
  const Icon = config.icon;

  // Animation lifecycle
  useEffect(() => {
    if (!isVisible) return;

    const enterDuration = 800;
    const displayDuration = duration - 1600; // Total minus enter and exit
    const exitDuration = 800;

    // Enter phase
    setAnimationPhase('enter');
    
    const enterTimer = setTimeout(() => {
      setAnimationPhase('display');
      
      // Display phase with progress
      const displayTimer = setTimeout(() => {
        setAnimationPhase('exit');
        
        // Exit phase
        const exitTimer = setTimeout(() => {
          onComplete();
        }, exitDuration);

        return () => clearTimeout(exitTimer);
      }, displayDuration);

      return () => clearTimeout(displayTimer);
    }, enterDuration);

    return () => clearTimeout(enterTimer);
  }, [isVisible, duration, onComplete]);

  // Progress tracking during display phase
  useEffect(() => {
    if (animationPhase !== 'display') return;

    const displayDuration = duration - 1600;
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (displayDuration / 100));
        return Math.min(newProgress, 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [animationPhase, duration]);

  // Generate floating particles
  const generateParticles = () => {
    return Array.from({ length: 12 }, (_, i) => (
      <div
        key={i}
        className={`absolute text-2xl opacity-60 animate-float-${i % 4}`}
        style={{
          left: `${10 + (i * 7)}%`,
          top: `${20 + (i % 3) * 20}%`,
          animationDelay: `${i * 0.2}s`,
          animationDuration: `${3 + (i % 2)}s`,
        }}
      >
        {config.particles}
      </div>
    ));
  };

  // Get animation classes based on phase and type
  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-800 ease-in-out';
    
    switch (animationPhase) {
      case 'enter':
        return `${baseClasses} opacity-0 scale-95 translate-y-4`;
      case 'display':
        return `${baseClasses} opacity-100 scale-100 translate-y-0`;
      case 'exit':
        return `${baseClasses} opacity-0 scale-105 translate-y-2`;
      default:
        return baseClasses;
    }
  };

  // Get icon animation classes
  const getIconAnimationClasses = () => {
    switch (config.animation) {
      case 'sunrise':
        return 'animate-spin-slow';
      case 'celebration':
        return 'animate-bounce';
      case 'gentle-wave':
        return 'animate-pulse';
      case 'energy-pulse':
        return 'animate-ping';
      case 'heart-pulse':
        return 'animate-pulse';
      default:
        return 'animate-pulse';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className={`relative ${getAnimationClasses()}`}>
        {/* Background with gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.bgColor} rounded-3xl blur-xl scale-110`} />
        
        {/* Main content */}
        <div className={`relative bg-white bg-opacity-90 backdrop-blur-sm rounded-3xl p-12 max-w-md w-full mx-4 shadow-2xl border border-white border-opacity-50`}>
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {generateParticles()}
          </div>
          
          {/* Icon */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${config.color} text-white mb-4 ${getIconAnimationClasses()}`}>
              <Icon className="w-10 h-10" />
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {config.title}
            </h2>
            
            {/* Message */}
            <p className="text-gray-600 text-center leading-relaxed">
              {message || config.defaultMessage}
            </p>
          </div>
          
          {/* Progress indicator during display phase */}
          {animationPhase === 'display' && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 bg-opacity-50 rounded-full h-1">
                <div
                  className={`h-1 rounded-full bg-gradient-to-r ${config.color} transition-all duration-100 ease-out`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Breathing indicator for longer transitions */}
          {duration > 5000 && animationPhase === 'display' && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                <span>Take slow, deep breaths</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Ambient glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-10 rounded-3xl animate-pulse`} />
      </div>
      
      {/* Custom CSS for floating animations */}
      <style jsx>{`
        @keyframes float-0 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-180deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(90deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(-90deg); }
        }
        .animate-float-0 { animation: float-0 3s ease-in-out infinite; }
        .animate-float-1 { animation: float-1 3.5s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 4s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 3.2s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
      `}</style>
    </div>
  );
};

export default TransitionAnimations;