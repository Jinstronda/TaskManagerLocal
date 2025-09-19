import React, { useState } from 'react';
import { Calendar, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  onRefresh,
  isLoading
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const validateDateRange = (start: string, end: string): string | null => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (startDate > endDate) {
      return 'Start date must be before end date';
    }
    
    if (endDate > today) {
      return 'End date cannot be in the future';
    }
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      return 'Date range cannot exceed 365 days';
    }
    
    return null;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    const error = validateDateRange(newStartDate, endDate);
    setValidationError(error);
    
    if (!error) {
      onDateRangeChange(newStartDate, endDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    const error = validateDateRange(startDate, newEndDate);
    setValidationError(error);
    
    if (!error) {
      onDateRangeChange(startDate, newEndDate);
    }
  };

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    const error = validateDateRange(startStr, endStr);
    setValidationError(error);
    
    if (!error) {
      onDateRangeChange(startStr, endStr);
      setShowPresets(false);
    }
  };

  const setCustomPreset = (type: 'week' | 'month' | 'quarter' | 'year') => {
    const end = new Date();
    const start = new Date();
    
    switch (type) {
      case 'week':
        // Start of current week (Sunday)
        start.setDate(start.getDate() - start.getDay());
        break;
      case 'month':
        // Start of current month
        start.setDate(1);
        break;
      case 'quarter':
        // Start of current quarter
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        break;
      case 'year':
        // Start of current year
        start.setMonth(0, 1);
        break;
    }
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    const error = validateDateRange(startStr, endStr);
    setValidationError(error);
    
    if (!error) {
      onDateRangeChange(startStr, endStr);
      setShowPresets(false);
    }
  };

  const presetRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 14 days', days: 14 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  const customPresets = [
    { label: 'This week', type: 'week' as const },
    { label: 'This month', type: 'month' as const },
    { label: 'This quarter', type: 'quarter' as const },
    { label: 'This year', type: 'year' as const },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Analytics Period
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date inputs */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className={`px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:border-transparent ${
                validationError 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              }`}
              max={endDate}
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className={`px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:border-transparent ${
                validationError 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              }`}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Presets</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              onClick={onRefresh}
              disabled={isLoading || !!validationError}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : validationError ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Invalid</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Update</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
          </div>
        </div>
      )}

      {/* Preset ranges */}
      {showPresets && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Recent periods:</span>
              <div className="flex flex-wrap gap-2">
                {presetRanges.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => setPresetRange(preset.days)}
                    className="px-3 py-1 text-xs bg-white dark:bg-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 border border-gray-200 dark:border-gray-500 rounded-full transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Current periods:</span>
              <div className="flex flex-wrap gap-2">
                {customPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => setCustomPreset(preset.type)}
                    className="px-3 py-1 text-xs bg-white dark:bg-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-300 border border-gray-200 dark:border-gray-500 rounded-full transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date range summary */}
      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        Showing data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
        {(() => {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return ` (${diffDays} day${diffDays !== 1 ? 's' : ''})`;
        })()}
      </div>
    </div>
  );
};

export default DateRangePicker;