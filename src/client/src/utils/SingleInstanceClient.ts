/**
 * Client-side single instance detection using localStorage and BroadcastChannel
 * Prevents multiple browser tabs from running the same application
 */
export class SingleInstanceClient {
  private static instance: SingleInstanceClient;
  private channel: BroadcastChannel;
  private instanceId: string;
  private isActive = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.instanceId = `task-tracker-${Date.now()}-${Math.random()}`;
    this.channel = new BroadcastChannel('task-tracker-instances');
    this.setupMessageHandling();
  }

  public static getInstance(): SingleInstanceClient {
    if (!SingleInstanceClient.instance) {
      SingleInstanceClient.instance = new SingleInstanceClient();
    }
    return SingleInstanceClient.instance;
  }

  /**
   * Check if this should be the active instance
   */
  public async checkAndActivate(): Promise<boolean> {
    // Check if there's already an active instance
    const activeInstance = localStorage.getItem('task-tracker-active-instance');
    const lastHeartbeat = localStorage.getItem('task-tracker-last-heartbeat');
    
    if (activeInstance && lastHeartbeat) {
      const heartbeatAge = Date.now() - parseInt(lastHeartbeat);
      
      // If heartbeat is recent (less than 10 seconds), another instance is active
      if (heartbeatAge < 10000) {
        console.log('Another tab is already running Local Task Tracker');
        this.showDuplicateTabWarning();
        return false;
      }
    }

    // Become the active instance
    this.becomeActiveInstance();
    return true;
  }

  /**
   * Become the active instance
   */
  private becomeActiveInstance(): void {
    this.isActive = true;
    localStorage.setItem('task-tracker-active-instance', this.instanceId);
    this.updateHeartbeat();
    
    // Start heartbeat to indicate this instance is alive
    this.heartbeatInterval = setInterval(() => {
      this.updateHeartbeat();
    }, 5000);

    // Notify other instances that we're now active
    this.channel.postMessage({
      type: 'instance-activated',
      instanceId: this.instanceId,
      timestamp: Date.now()
    });

    console.log('This tab is now the active Local Task Tracker instance');
  }

  /**
   * Update heartbeat timestamp
   */
  private updateHeartbeat(): void {
    localStorage.setItem('task-tracker-last-heartbeat', Date.now().toString());
  }

  /**
   * Set up message handling between tabs
   */
  private setupMessageHandling(): void {
    this.channel.addEventListener('message', (event) => {
      const { type, instanceId } = event.data;

      switch (type) {
        case 'instance-activated':
          if (instanceId !== this.instanceId && this.isActive) {
            // Another instance became active, deactivate this one
            this.deactivate();
          }
          break;

        case 'ping':
          if (this.isActive) {
            // Respond to ping to show we're alive
            this.channel.postMessage({
              type: 'pong',
              instanceId: this.instanceId,
              timestamp: Date.now()
            });
          }
          break;

        case 'request-focus':
          if (this.isActive) {
            // Focus this tab
            window.focus();
            
            // Show a notification that the app is already running
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Local Task Tracker', {
                body: 'Application is already running in this tab.',
                icon: '/favicon.ico'
              });
            }
          }
          break;
      }
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isActive) {
        // Update heartbeat when tab becomes visible
        this.updateHeartbeat();
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * Show warning about duplicate tabs
   */
  private showDuplicateTabWarning(): void {
    // Create a simple overlay to inform user
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 2rem;">
        <h2 style="margin-bottom: 1rem; font-size: 1.5rem;">Local Task Tracker Already Running</h2>
        <p style="margin-bottom: 2rem; line-height: 1.5;">
          Local Task Tracker is already running in another tab. 
          To prevent data conflicts, only one instance can be active at a time.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="focus-existing" style="
            padding: 0.75rem 1.5rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
          ">Switch to Active Tab</button>
          <button id="close-tab" style="
            padding: 0.75rem 1.5rem;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
          ">Close This Tab</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Handle button clicks
    overlay.querySelector('#focus-existing')?.addEventListener('click', () => {
      // Try to focus the existing tab
      this.channel.postMessage({
        type: 'request-focus',
        instanceId: this.instanceId,
        timestamp: Date.now()
      });
    });

    overlay.querySelector('#close-tab')?.addEventListener('click', () => {
      window.close();
    });
  }

  /**
   * Deactivate this instance
   */
  private deactivate(): void {
    this.isActive = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    console.log('This tab is no longer the active instance');
  }

  /**
   * Cleanup when instance is destroyed
   */
  private cleanup(): void {
    if (this.isActive) {
      localStorage.removeItem('task-tracker-active-instance');
      localStorage.removeItem('task-tracker-last-heartbeat');
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.channel.close();
  }

  /**
   * Check if this instance is currently active
   */
  public isActiveInstance(): boolean {
    return this.isActive;
  }
}

export const singleInstanceClient = SingleInstanceClient.getInstance();