import { useEffect, useState, useCallback, useRef } from 'react';
import { performanceOptimizer, PerformanceMetrics } from '../utils/PerformanceOptimizer';

/**
 * React hook for monitoring and optimizing component performance
 * Provides 60fps monitoring, performance metrics, and optimization utilities
 */
export function usePerformanceMonitoring(componentName?: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    layoutTime: 0,
    paintTime: 0,
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceWarnings, setPerformanceWarnings] = useState<string[]>([]);
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  // Track component renders
  useEffect(() => {
    renderCountRef.current++;
    const renderTime = performance.now() - lastRenderTimeRef.current;
    lastRenderTimeRef.current = performance.now();
    
    if (componentName && renderTime > 16.67) { // Slower than 60fps
      console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms (>16.67ms budget)`);
    }
  });

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    
    // Set up performance callbacks
    performanceOptimizer.setCallbacks({
      onFrameDrop: (frameMetrics) => {
        setMetrics(frameMetrics);
        if (componentName) {
          console.warn(`Frame drop detected in ${componentName}:`, frameMetrics);
        }
      },
      onPerformanceWarning: (warning, warningMetrics) => {
        setMetrics(warningMetrics);
        setPerformanceWarnings(prev => [...prev.slice(-9), warning]); // Keep last 10 warnings
        if (componentName) {
          console.warn(`Performance warning in ${componentName}: ${warning}`);
        }
      },
    });
    
    performanceOptimizer.startMonitoring();
    
    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      const currentMetrics = performanceOptimizer.getCurrentMetrics();
      setMetrics(currentMetrics);
    }, 1000); // Update every second
    
    return () => {
      clearInterval(metricsInterval);
    };
  }, [isMonitoring, componentName]);

  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    performanceOptimizer.stopMonitoring();
  }, []);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return performanceOptimizer.getPerformanceReport();
  }, []);

  // Optimized animation frame
  const useOptimizedAnimation = useCallback((
    callback: (timestamp: number, deltaTime: number) => void
  ) => {
    return performanceOptimizer.optimizedAnimation(callback);
  }, []);

  // Throttled function for performance
  const useThrottledCallback = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    fps: number = 60
  ): T => {
    return performanceOptimizer.throttleForFrameRate(func, fps);
  }, []);

  // Debounced function for performance
  const useDebouncedCallback = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number = 16.67
  ): T => {
    return performanceOptimizer.debounceForPerformance(func, delay);
  }, []);

  // Batch DOM operations
  const batchDOMOperations = useCallback((operations: (() => void)[]) => {
    performanceOptimizer.batchDOMOperations(operations);
  }, []);

  // Time slice large updates
  const timeSliceUpdates = useCallback(<T>(
    items: T[],
    processItem: (item: T) => void,
    batchSize: number = 10
  ): Promise<void> => {
    return performanceOptimizer.timeSliceUpdates(items, processItem, batchSize);
  }, []);

  // Check if performance is within budget
  const isPerformanceGood = useCallback(() => {
    return performanceOptimizer.isPerformanceWithinBudget();
  }, []);

  // Clear performance warnings
  const clearWarnings = useCallback(() => {
    setPerformanceWarnings([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isMonitoring) {
        performanceOptimizer.stopMonitoring();
      }
    };
  }, [isMonitoring]);

  return {
    // State
    metrics,
    isMonitoring,
    performanceWarnings,
    renderCount: renderCountRef.current,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    clearWarnings,
    
    // Utilities
    getPerformanceReport,
    isPerformanceGood,
    
    // Optimization helpers
    useOptimizedAnimation,
    useThrottledCallback,
    useDebouncedCallback,
    batchDOMOperations,
    timeSliceUpdates,
  };
}

/**
 * Hook for monitoring specific component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    renderTimes.current.push(renderTime);
    
    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }
    
    // Warn about slow renders
    if (renderTime > 16.67) {
      console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
    }
  });

  const getAverageRenderTime = useCallback(() => {
    if (renderTimes.current.length === 0) return 0;
    const sum = renderTimes.current.reduce((a, b) => a + b, 0);
    return sum / renderTimes.current.length;
  }, []);

  const getLastRenderTime = useCallback(() => {
    return renderTimes.current[renderTimes.current.length - 1] || 0;
  }, []);

  return {
    averageRenderTime: getAverageRenderTime(),
    lastRenderTime: getLastRenderTime(),
    renderCount: renderTimes.current.length,
  };
}

/**
 * Hook for optimizing expensive computations
 */
export function useOptimizedComputation<T>(
  computation: () => T,
  dependencies: React.DependencyList,
  options: {
    timeSlice?: boolean;
    maxExecutionTime?: number;
  } = {}
): { result: T | null; isComputing: boolean; error: Error | null } {
  const [result, setResult] = useState<T | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { timeSlice = false, maxExecutionTime = 16.67 } = options;

  useEffect(() => {
    setIsComputing(true);
    setError(null);
    
    const executeComputation = async () => {
      try {
        if (timeSlice) {
          // Time-sliced execution for heavy computations
          let computationResult: T;
          
          await new Promise<void>((resolve) => {
            const timeSlicedExecution = () => {
              const sliceStartTime = performance.now();
              
              try {
                computationResult = computation();
                setResult(computationResult);
                resolve();
              } catch (err) {
                const executionTime = performance.now() - sliceStartTime;
                
                if (executionTime > maxExecutionTime) {
                  // If execution is taking too long, defer to next frame
                  requestAnimationFrame(timeSlicedExecution);
                } else {
                  throw err;
                }
              }
            };
            
            timeSlicedExecution();
          });
        } else {
          // Regular execution with performance monitoring
          const startTime = performance.now();
          const computationResult = computation();
          const executionTime = performance.now() - startTime;
          
          if (executionTime > maxExecutionTime) {
            console.warn(`Computation exceeded time budget: ${executionTime.toFixed(2)}ms > ${maxExecutionTime}ms`);
          }
          
          setResult(computationResult);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Computation error:', err);
      } finally {
        setIsComputing(false);
      }
    };

    executeComputation();
  }, dependencies);

  return { result, isComputing, error };
}