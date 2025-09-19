import React, { useEffect, useState } from 'react';
import { Trophy, Star, Medal, Crown, Zap, Target, Calendar, Flame } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'time' | 'consistency' | 'milestone' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: Date;
  progress?: {
    current: number;
    target: number;
  };
}

interface AchievementBadgesProps {
  className?: string;
  showProgress?: boolean;
  filterCategory?: Achievement['category'];
  maxDisplay?: number;
}

/**
 * AchievementBadges Component
 * 
 * Displays achievement badges with milestone rewards.
 * Shows unlocked achievements, progress towards locked ones,
 * and provides visual feedback for accomplishments.
 */
export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  className = '',
  showProgress = true,
  filterCategory,
  maxDisplay
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/focus-score/achievements');
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      
      const data = await response.json();
      setAchievements(data.achievements || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to mock data for demonstration
      setAchievements(getMockAchievements());
    } finally {
      setLoading(false);
    }
  };

  const getMockAchievements = (): Achievement[] => [
    {
      id: 'first-session',
      title: 'First Steps',
      description: 'Complete your first focus session',
      icon: 'zap',
      category: 'milestone',
      tier: 'bronze',
      unlockedAt: new Date('2024-01-15'),
    },
    {
      id: 'streak-3',
      title: 'Getting Started',
      description: 'Maintain a 3-day focus streak',
      icon: 'flame',
      category: 'streak',
      tier: 'bronze',
      progress: { current: 0, target: 3 }
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day focus streak',
      icon: 'flame',
      category: 'streak',
      tier: 'silver',
      progress: { current: 0, target: 7 }
    },
    {
      id: 'streak-30',
      title: 'Month Master',
      description: 'Maintain a 30-day focus streak',
      icon: 'crown',
      category: 'streak',
      tier: 'gold',
      progress: { current: 0, target: 30 }
    },
    {
      id: 'time-10h',
      title: 'Focused Ten',
      description: 'Complete 10 hours of focused work',
      icon: 'target',
      category: 'time',
      tier: 'bronze',
      progress: { current: 0.38, target: 10 }
    },
    {
      id: 'time-100h',
      title: 'Century Club',
      description: 'Complete 100 hours of focused work',
      icon: 'medal',
      category: 'time',
      tier: 'silver',
      progress: { current: 0.38, target: 100 }
    },
    {
      id: 'consistency-week',
      title: 'Consistent Creator',
      description: 'Complete sessions 5 days in a row',
      icon: 'calendar',
      category: 'consistency',
      tier: 'silver',
      progress: { current: 1, target: 5 }
    },
    {
      id: 'perfect-score',
      title: 'Perfect Focus',
      description: 'Achieve a perfect focus score of 100',
      icon: 'star',
      category: 'special',
      tier: 'platinum',
      progress: { current: 0, target: 100 }
    }
  ];

  const getIcon = (iconName: string) => {
    const iconMap = {
      trophy: Trophy,
      star: Star,
      medal: Medal,
      crown: Crown,
      zap: Zap,
      target: Target,
      calendar: Calendar,
      flame: Flame
    };
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Trophy;
    return IconComponent;
  };

  const getTierColors = (tier: Achievement['tier'], unlocked: boolean) => {
    const colors = {
      bronze: {
        bg: unlocked ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800',
        border: unlocked ? 'border-orange-300 dark:border-orange-700' : 'border-gray-300 dark:border-gray-600',
        icon: unlocked ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400',
        text: unlocked ? 'text-orange-800 dark:text-orange-200' : 'text-gray-500 dark:text-gray-400'
      },
      silver: {
        bg: unlocked ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800',
        border: unlocked ? 'border-gray-400 dark:border-gray-500' : 'border-gray-300 dark:border-gray-600',
        icon: unlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400',
        text: unlocked ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'
      },
      gold: {
        bg: unlocked ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-800',
        border: unlocked ? 'border-yellow-300 dark:border-yellow-700' : 'border-gray-300 dark:border-gray-600',
        icon: unlocked ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400',
        text: unlocked ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-500 dark:text-gray-400'
      },
      platinum: {
        bg: unlocked ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-800',
        border: unlocked ? 'border-purple-300 dark:border-purple-700' : 'border-gray-300 dark:border-gray-600',
        icon: unlocked ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400',
        text: unlocked ? 'text-purple-800 dark:text-purple-200' : 'text-gray-500 dark:text-gray-400'
      }
    };
    return colors[tier];
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    const categoryIcons = {
      streak: Flame,
      time: Target,
      consistency: Calendar,
      milestone: Star,
      special: Crown
    };
    return categoryIcons[category];
  };

  const formatProgress = (progress: Achievement['progress']) => {
    if (!progress) return '';
    const percentage = Math.min(100, (progress.current / progress.target) * 100);
    return `${progress.current}/${progress.target} (${Math.round(percentage)}%)`;
  };

  let filteredAchievements = achievements;
  if (filterCategory) {
    filteredAchievements = achievements.filter(a => a.category === filterCategory);
  }
  if (maxDisplay) {
    filteredAchievements = filteredAchievements.slice(0, maxDisplay);
  }

  // Sort: unlocked first, then by tier, then by progress
  filteredAchievements.sort((a, b) => {
    const aUnlocked = !!a.unlockedAt;
    const bUnlocked = !!b.unlockedAt;
    
    if (aUnlocked !== bUnlocked) {
      return bUnlocked ? 1 : -1; // Unlocked first
    }
    
    const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    
    // Sort by progress if both locked
    if (!aUnlocked && !bUnlocked && a.progress && b.progress) {
      const aProgress = a.progress.current / a.progress.target;
      const bProgress = b.progress.current / b.progress.target;
      return bProgress - aProgress;
    }
    
    return 0;
  });

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && achievements.length === 0) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <Trophy className="w-5 h-5" />
          <span className="font-medium">Error Loading Achievements</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button
          onClick={fetchAchievements}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Achievement Badges
        </h3>
        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
          {achievements.filter(a => a.unlockedAt).length}/{achievements.length}
        </span>
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAchievements.map((achievement) => {
            const unlocked = !!achievement.unlockedAt;
            const colors = getTierColors(achievement.tier, unlocked);
            const IconComponent = getIcon(achievement.icon);
            const CategoryIcon = getCategoryIcon(achievement.category);
            
            return (
              <div
                key={achievement.id}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${colors.bg} ${colors.border} ${
                  unlocked ? 'shadow-md hover:shadow-lg' : 'opacity-75'
                }`}
              >
                {/* Category Badge */}
                <div className="absolute top-2 right-2">
                  <CategoryIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </div>
                
                {/* Achievement Icon */}
                <div className="flex justify-center mb-3">
                  <div className={`p-3 rounded-full ${colors.bg} ${colors.border} border`}>
                    <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                </div>
                
                {/* Achievement Info */}
                <div className="text-center">
                  <h4 className={`font-medium text-sm mb-1 ${colors.text}`}>
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {achievement.description}
                  </p>
                  
                  {/* Tier Badge */}
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)}
                  </div>
                  
                  {/* Progress or Unlock Date */}
                  {unlocked && achievement.unlockedAt ? (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Unlocked {achievement.unlockedAt.toLocaleDateString()}
                    </div>
                  ) : showProgress && achievement.progress ? (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {formatProgress(achievement.progress)}
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-500 ${
                            achievement.tier === 'bronze' ? 'bg-orange-500' :
                            achievement.tier === 'silver' ? 'bg-gray-500' :
                            achievement.tier === 'gold' ? 'bg-yellow-500' : 'bg-purple-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, (achievement.progress.current / achievement.progress.target) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ) : null}
                </div>
                
                {/* Unlock Effect */}
                {unlocked && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Achievements Yet
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Start completing focus sessions to unlock achievement badges!
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementBadges;