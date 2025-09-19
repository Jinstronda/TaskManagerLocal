import React, { useState } from 'react';
import { Calendar, Clock, Star, MessageSquare, CheckCircle, X, ArrowRight } from 'lucide-react';
import { ReviewPrompt, ReviewQuestion, ReviewResponse } from '../../../../shared/types';

interface ReviewPromptProps {
  prompt: ReviewPrompt;
  onSubmit: (response: ReviewResponse) => void;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  isVisible: boolean;
}

/**
 * Review prompt component for daily and weekly reflection
 * Provides structured questions to help users reflect on their productivity
 */
const ReviewPromptComponent: React.FC<ReviewPromptProps> = ({
  prompt,
  onSubmit,
  onDismiss,
  onSnooze,
  isVisible,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isVisible) return null;

  const currentQuestion = prompt.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === prompt.questions.length - 1;
  const canProceed = !currentQuestion.required || responses[currentQuestion.id] !== undefined;

  // Handle response change
  const handleResponseChange = (questionId: string, value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Navigate to next question
  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit the review
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response: ReviewResponse = {
        promptId: `${prompt.type}_${Date.now()}`,
        responses,
        completedAt: new Date(),
      };
      await onSubmit(response);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get icon based on prompt type
  const getPromptIcon = () => {
    switch (prompt.type) {
      case 'daily':
        return <Calendar className="w-6 h-6 text-blue-600" />;
      case 'weekly':
        return <Clock className="w-6 h-6 text-purple-600" />;
      case 'session_end':
        return <Star className="w-6 h-6 text-green-600" />;
      default:
        return <MessageSquare className="w-6 h-6 text-gray-600" />;
    }
  };

  // Render question input based on type
  const renderQuestionInput = (question: ReviewQuestion) => {
    switch (question.type) {
      case 'rating':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Poor</span>
              <span className="text-sm text-gray-600">Excellent</span>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleResponseChange(question.id, rating)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    responses[question.id] === rating
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-600 hover:border-blue-400'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <textarea
            value={responses[question.id] as string || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={responses[question.id] === option}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="yes"
                checked={responses[question.id] === 'yes'}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="text-gray-700">Yes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="no"
                checked={responses[question.id] === 'no'}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className="text-gray-700">No</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getPromptIcon()}
              <div>
                <h2 className="text-xl font-semibold">{prompt.title}</h2>
                <p className="text-blue-100 text-sm">
                  {prompt.type === 'daily' && 'Daily Reflection'}
                  {prompt.type === 'weekly' && 'Weekly Review'}
                  {prompt.type === 'session_end' && 'Session Reflection'}
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close review"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {prompt.questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / prompt.questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / prompt.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {currentQuestion.question}
            </h3>
            {currentQuestion.required && (
              <p className="text-sm text-red-600 mb-3">* Required</p>
            )}
            {renderQuestionInput(currentQuestion)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSnooze(15)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Snooze 15m
              </button>
              
              <button
                onClick={handleNext}
                disabled={!canProceed || isSubmitting}
                className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  canProceed && !isSubmitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : isLastQuestion ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPromptComponent;