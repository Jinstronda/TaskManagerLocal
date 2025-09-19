/**
 * Client-side performance optimization utilities for maintaining 60fps UI responsiveness
 * Provides frame rate monitoring, animation optimization, and performance budgeting
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
  layoutTime: number;
  paintTime: number;
}

export interface PerformanceBudget {
  maxFrameTime: number; // 16.67ms for 60fps
  maxRenderTime: number; // 10ms budget for rendering
  maxLayoutTime: number; // 3ms budget for layout
  maxPaintTime: number; // 3ms budget for painting
}

/**
 * Performance optimizer for maintaining 60fps UI responsiveness
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private frameTimeHistory: number[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private animationFrameId: number | null = null;
  private isMonitoring = false;

  // Performance budgets for 60fps (16.67ms per frame)
  private budget: PerformanceBudget = {
    maxFrameTime: 16.67, // 60fps target
    maxRenderTime: 10,   // Rendering budget
    maxLayoutTime: 3,    // Layout budget
    maxPaintTime: 3,     // Paint budget
  };

  private callbacks: {
    onFrameDrop: (metrics: PerformanceMetrics) => void;
    onPerformanceWarning: (warning: string, metrics: PerformanceMetrics) => void;
  } = {
    onFrameDrop: () => {},
    onPerformanceWarning: () => {},
  };

  private constructor() {
    this.setupPerformanceObserver();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Start monitoring frame rate and performance
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.frameTimeHistory = [];
    
    this.monitorFrameRate();
    console.log('Performance monitoring started - targeting 60fps');
  }

  /**
   * Stop monitoring performance
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('Performance monitoring stopped');
  }

  /**
   * Set performance event callbacks
   */
  public setCallbacks(callbacks: Partial<typeof this.callbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    const frameTime = this.frameTimeHistory.length > 0 
      ? this.frameTimeHistory[this.frameTimeHistory.length - 1] 
      : 0;
    
    const fps = this.calculateFPS();
    
    return {
      fps,
      frameTime,
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.getLastRenderTime(),
      layoutTime: this.getLastLayoutTime(),
      paintTime: this.getLastPaintTime(),
    };
  }

  /**
   * Check if performance is within budget
   */
  public isPerformanceWithinBudget(): boolean {
    const metrics = this.getCurrentMetrics();
    
    return (
      metrics.frameTime <= this.budget.maxFrameTime &&
      metrics.renderTime <= this.budget.maxRenderTime &&
      metrics.layoutTime <= this.budget.maxLayoutTime &&
      metrics.paintTime <= this.budget.maxPaintTime
    );
  }

  /**
   * Optimize animation using requestAnimationFrame with performance monitoring
   */
  public optimizedAnimation(callback: (timestamp: number, deltaTime: number) => void): number {
    let lastTimestamp = 0;
    
    const animationLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Monitor frame time
      if (deltaTime > this.budget.maxFrameTime) {
        const metrics = this.getCurrentMetrics();
        this.callbacks.onFrameDrop(metrics);
      }
      
      // Execute callback with performance tracking
      const startTime = performance.now();
      callback(timestamp, deltaTime);
      const executionTime = performance.now() - startTime;
      
      // Warn if callback takes too long
      if (executionTime > this.budget.maxRenderTime) {
        const metrics = this.getCurrentMetrics();
        this.callbacks.onPerformanceWarning(
          `Animation callback exceeded render budget: ${executionTime.toFixed(2)}ms > ${this.budget.maxRenderTime}ms`,
          metrics
        );
      }
      
      return requestAnimationFrame(animationLoop);
    };
    
    return requestAnimationFrame(animationLoop);
  }

  /**
   * Throttle function calls to maintain 60fps
   */
  public throttleForFrameRate<T extends (...args: any[]) => any>(
    func: T,
    fps: number = 60
  ): T {
    const interval = 1000 / fps;
    let lastCall = 0;
    
    return ((...args: Parameters<T>) => {
      const now = performance.now();
      if (now - lastCall >= interval) {
        lastCall = now;
        return func(...args);
      }
    }) as T;
  }

  /**
   * Debounce function calls with performance consideration
   */
  public debounceForPerformance<T extends (...args: any[]) => any>(
    func: T,
    delay: number = 16.67 // One frame at 60fps
  ): T {
    let timeoutId: number;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        const startTime = performance.now();
        const result = func(...args);
        const executionTime = performance.now() - startTime;
        
        if (executionTime > this.budget.maxRenderTime) {
          const metrics = this.getCurrentMetrics();
          this.callbacks.onPerformanceWarning(
            `Debounced function exceeded render budget: ${executionTime.toFixed(2)}ms`,
            metrics
          );
        }
        
        return result;
      }, delay);
    }) as T;
  }

  /**
   * Batch DOM operations to minimize layout thrashing
   */
  public batchDOMOperations(operations: (() => void)[]): void {
    // Use requestAnimationFrame to batch operations
    requestAnimationFrame(() => {
      const startTime = performance.now();
      
      // Execute all operations in a single frame
      operations.forEach(operation => {
        try {
          operation();
        } catch (error) {
          console.error('Error in batched DOM operation:', error);
        }
      });
      
      const executionTime = performance.now() - startTime;
      
      if (executionTime > this.budget.maxFrameTime) {
        const metrics = this.getCurrentMetrics();
        this.callbacks.onPerformanceWarning(
          `Batched DOM operations exceeded frame budget: ${executionTime.toFixed(2)}ms`,
          metrics
        );
      }
    });
  }

  /**
   * Optimize React component updates using time slicing
   */
  public timeSliceUpdates<T>(
    items: T[],
    processItem: (item: T) => void,
    batchSize: number = 10
  ): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;
      
      const processBatch = () => {
        const startTime = performance.now();
        const endIndex = Math.min(index + batchSize, items.length);
        
        // Process batch
        for (let i = index; i < endIndex; i++) {
          processItem(items[i]);
        }
        
        index = endIndex;
        const batchTime = performance.now() - startTime;
        
        // Check if we need to continue
        if (index < items.length) {
          // If batch took too long, reduce batch size
          if (batchTime > this.budget.maxRenderTime) {
            batchSize = Math.max(1, Math.floor(batchSize * 0.8));
          }
          
          // Schedule next batch
          requestAnimationFrame(processBatch);
        } else {
          resolve();
        }
      };
      
      processBatch();
    });
  }

  /**
   * Monitor frame rate using requestAnimationFrame
   */
  private monitorFrameRate(): void {
    const frameCallback = (timestamp: number) => {
      if (!this.isMonitoring) return;
      
      const frameTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;
      this.frameCount++;
      
      // Record frame time
      this.frameTimeHistory.push(frameTime);
      
      // Keep only last 60 frames (1 second at 60fps)
      if (this.frameTimeHistory.length > 60) {
        this.frameTimeHistory.shift();
      }
      
      // Check for frame drops
      if (frameTime > this.budget.maxFrameTime * 1.5) { // 25ms threshold
        const metrics = this.getCurrentMetrics();
        this.callbacks.onFrameDrop(metrics);
      }
      
      this.animationFrameId = requestAnimationFrame(frameCallback);
    };
    
    this.animationFrameId = requestAnimationFrame(frameCallback);
  }

  /**
   * Calculate current FPS
   */
  private calculateFPS(): number {
    if (this.frameTimeHistory.length < 2) return 0;
    
    const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Get last render time from performance entries
   */
  private getLastRenderTime(): number {
    const entries = performance.getEntriesByType('measure');
    const renderEntries = entries.filter(entry => entry.name.includes('render'));
    return renderEntries.length > 0 ? renderEntries[renderEntries.length - 1].duration : 0;
  }

  /**
   * Get last layout time from performance entries
   */
  private getLastLayoutTime(): number {
    const entries = performance.getEntriesByType('measure');
    const layoutEntries = entries.filter(entry => entry.name.includes('layout'));
    return layoutEntries.length > 0 ? layoutEntries[layoutEntries.length - 1].duration : 0;
  }

  /**
   * Get last paint time from performance entries
   */
  private getLastPaintTime(): number {
    const entries = performance.getEntriesByType('paint');
    return entries.length > 0 ? entries[entries.length - 1].startTime : 0;
  }

  /**
   * Setup performance observer for detailed metrics
   */
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach(entry => {
            // Monitor long tasks that could cause frame drops
            if (entry.entryType === 'longtask' && entry.duration > this.budget.maxFrameTime) {
              const metrics = this.getCurrentMetrics();
              this.callbacks.onPerformanceWarning(
                `Long task detected: ${entry.duration.toFixed(2)}ms`,
                metrics
              );
            }
            
            // Monitor layout shifts
            if (entry.entryType === 'layout-shift' && (entry as any).value > 0.1) {
              const metrics = this.getCurrentMetrics();
              this.callbacks.onPerformanceWarning(
                `Layout shift detected: ${(entry as any).value.toFixed(3)}`,
                metrics
              );
            }
          });
        });
        
        // Observe long tasks and layout shifts
        this.performanceObserver.observe({ entryTypes: ['longtask', 'layout-shift'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  /**
   * Get performance report
   */
  public getPerformanceReport(): {
    averageFPS: number;
    frameDrops: number;
    performanceScore: number;
    recommendations: string[];
  } {
    const metrics = this.getCurrentMetrics();
    const frameDrops = this.frameTimeHistory.filter(time => time > this.budget.maxFrameTime).length;
    const frameDropRate = this.frameTimeHistory.length > 0 ? frameDrops / this.frameTimeHistory.length : 0;
    
    // Calculate performance score (0-100)
    const fpsScore = Math.min(100, (metrics.fps / 60) * 100);
    const frameDropScore = Math.max(0, 100 - (frameDropRate * 200));
    const performanceScore = (fpsScore + frameDropScore) / 2;
    
    const recommendations: string[] = [];
    
    if (metrics.fps < 55) {
      recommendations.push('Consider reducing animation complexity or frequency');
    }
    
    if (frameDropRate > 0.1) {
      recommendations.push('Optimize heavy operations using time slicing or web workers');
    }
    
    if (metrics.memoryUsage > 50) {
      recommendations.push('Monitor memory usage - consider implementing object pooling');
    }
    
    return {
      averageFPS: metrics.fps,
      frameDrops,
      performanceScore,
      recommendations,
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopMonitoring();
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();