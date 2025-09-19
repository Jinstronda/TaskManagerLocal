
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
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-soft border-r border-gray-100">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">Task Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">Local Productivity App</p>
          </div>
          
          <nav className="px-4 space-y-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="p-6">
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