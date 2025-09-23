
import React from 'react';
import { NavLink } from 'react-router-dom'
import { 
  Timer, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Home,
  Flame,
  Folder
} from 'lucide-react'
import { useOnboardingStore } from '../stores/onboardingStore';
import { OnboardingFlow } from './Onboarding';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isCompleted, completeOnboarding } = useOnboardingStore();
  
  // Initialize theme
  useTheme();
  
  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/timer', icon: Timer, label: 'Timer' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/categories', icon: Folder, label: 'Categories' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/habits', icon: Flame, label: 'Habits' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  const handleOnboardingComplete = () => {
    completeOnboarding();
  };

  return (
    <>
      <div className="flex h-screen bg-neutral-25">
        {/* Sidebar */}
        <div className="w-60 bg-white border-r border-neutral-200 flex flex-col">
          <div className="p-4 border-b border-neutral-100">
            <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">Task Tracker</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Local Productivity App</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.98]'
                  }`
                }
              >
                <Icon className={`w-4 h-4 mr-3 transition-colors flex-shrink-0 ${
                  ({ isActive }) => isActive ? 'text-neutral-700' : 'text-neutral-400 group-hover:text-neutral-600'
                }`} />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-neutral-100">
            <div className="text-xs text-neutral-400 text-center">
              v1.0.0
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="p-8 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Onboarding Flow */}
      {!isCompleted && (
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}
    </>
  )
}

export default Layout