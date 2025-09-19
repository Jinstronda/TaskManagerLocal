import { useState, useEffect } from 'react';
import { Activity, Zap, AlertTriangle, CheckCircle, BarChart3, Settings } from 'lucide-react';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';

/**
 * Performance monitoring and settings component
 * Displays real-time performance metrics and allows users to configure performance settings
 */
export function PerformanceSettings() {
  const {
    metrics,
    isMonitoring,
    performanceWarnings,
    startMonitoring,
    stopMonitoring,
    clearWarnings,
    getPerformanceReport,
    isPerformanceGood,
  } = usePerformanceMonitoring('PerformanceSettings');

  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update performance report periodically
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        setPerformanceReport(getPerformanceReport());
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isMonitoring, getPerformanceReport]);

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  const getPerformanceStatus = () => {
    if (!isMonitoring) return { status: 'inactive', color: 'text-gray-500', icon: Activity };
    
    const good = isPerformanceGood();
    if (good && metrics.fps >= 55) {
      return { status: 'excellent', color: 'text-green-500', icon: CheckCircle };
    } else if (metrics.fps >= 45) {
      return { status: 'good', color: 'text-yellow-500', icon: Zap };
    } else {
      return { status: 'poor', color: 'text-red-500', icon: AlertTriangle };
    }
  };

  const performanceStatus = getPerformanceStatus();
  const StatusIcon = performanceStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Monitoring
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor and optimize app performance for 60fps responsiveness
            </p>
          </div>
        </div>
        
        <button
          onClick={handleToggleMonitoring}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isMonitoring
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
          }`}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>

      {/* Performance Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Current Performance
          </h4>
          <div className={`flex items-center space-x-2 ${performanceStatus.color}`}>
            <StatusIcon className="w-5 h-5" />
            <span className="font-medium capitalize">{performanceStatus.status}</span>
          </div>
        </div>

        {isMonitoring ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.fps.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">FPS</div>
              <div className="text-xs text-gray-500">Target: 60</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.frameTime.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Frame Time (ms)</div>
              <div className="text-xs text-gray-500">Budget: 16.7</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.memoryUsage.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory (MB)</div>
              <div className="text-xs text-gray-500">Client-side</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.renderTime.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Render (ms)</div>
              <div className="text-xs text-gray-500">Budget: 10</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Start monitoring to see real-time performance metrics
          </div>
        )}
      </div>

      {/* Performance Report */}
      {performanceReport && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Performance Report
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {performanceReport.averageFPS.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average FPS</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {performanceReport.frameDrops}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Frame Drops</div>
            </div>
            
            <div className="text-center">
              <div className={`text-xl font-bold ${
                performanceReport.performanceScore >= 80 
                  ? 'text-green-600 dark:text-green-400'
                  : performanceReport.performanceScore >= 60
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {performanceReport.performanceScore.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Performance Score</div>
            </div>
          </div>

          {performanceReport.recommendations.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Recommendations:
              </h5>
              <ul className="space-y-1">
                {performanceReport.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Performance Warnings */}
      {performanceWarnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Performance Warnings ({performanceWarnings.length})
              </h4>
            </div>
            <button
              onClick={clearWarnings}
              className="text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
            >
              Clear
            </button>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {performanceWarnings.slice(-5).map((warning, index) => (
              <div key={index} className="text-xs text-yellow-700 dark:text-yellow-300">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Performance Settings
          </h4>
          <Settings className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {/* Auto Optimization */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Auto Optimization
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Automatically optimize performance when frame drops are detected
              </p>
            </div>
            <button
              onClick={() => setAutoOptimize(!autoOptimize)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoOptimize
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoOptimize ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Advanced Settings
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Show detailed performance configuration options
              </p>
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showAdvanced
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showAdvanced ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Performance Budgets:</strong>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>Frame Time: 16.67ms (60fps)</div>
                <div>Render Time: 10ms</div>
                <div>Layout Time: 3ms</div>
                <div>Paint Time: 3ms</div>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                <strong>Optimization Features:</strong>
              </div>
              <div className="text-xs space-y-1">
                <div>• Automatic frame rate monitoring</div>
                <div>• DOM operation batching</div>
                <div>• Time-sliced updates for large datasets</div>
                <div>• Memory usage optimization</div>
                <div>• Animation performance optimization</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}