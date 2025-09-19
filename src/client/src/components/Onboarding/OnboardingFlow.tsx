import React, { useEffect } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { WelcomeStep } from './WelcomeStep';
import { GoalSettingStep } from './GoalSettingStep';
import { WorkStyleStep } from './WorkStyleStep';
import { CategorySetupStep } from './CategorySetupStep';
import { NotificationPreferencesStep } from './NotificationPreferencesStep';
import { CompletionStep } from './CompletionStep';
import { ProgressIndicator } from './ProgressIndicator';
import { X } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const { 
    currentStep, 
    totalSteps, 
    setCurrentStep, 
    completeOnboarding,
    skipOnboarding,
    isCompleted 
  } = useOnboardingStore();

  // Handle completion
  useEffect(() => {
    if (isCompleted) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    skipOnboarding();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return <GoalSettingStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 2:
        return <WorkStyleStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 3:
        return <CategorySetupStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 4:
        return <NotificationPreferencesStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 5:
        return <CompletionStep onComplete={() => completeOnboarding()} />;
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Welcome to Local Task Tracker
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Let's set up your productivity workspace
            </p>
          </div>
          
          {onSkip && (
            <button
              onClick={handleSkip}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Skip onboarding"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <ProgressIndicator 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
          />
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};