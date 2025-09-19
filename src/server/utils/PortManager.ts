import { createServer } from 'net';
import { logger } from './logger';

/**
 * Port management utility for automatic port detection and management
 * Ensures the application can find an available port for localhost server
 */
export class PortManager {
  private static instance: PortManager;
  private defaultPort = 8001;
  private maxPortAttempts = 10;

  private constructor() {}

  public static getInstance(): PortManager {
    if (!PortManager.instance) {
      PortManager.instance = new PortManager();
    }
    return PortManager.instance;
  }

  /**
   * Find an available port starting from the default port
   */
  public async findAvailablePort(startPort: number = this.defaultPort): Promise<number> {
    for (let port = startPort; port < startPort + this.maxPortAttempts; port++) {
      if (await this.isPortAvailable(port)) {
        logger.info(`Found available port: ${port}`);
        return port;
      }
    }
    
    throw new Error(`No available ports found in range ${startPort}-${startPort + this.maxPortAttempts - 1}`);
  }

  /**
   * Check if a specific port is available
   */
  public async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Get the default port
   */
  public getDefaultPort(): number {
    return this.defaultPort;
  }

  /**
   * Set the default port
   */
  public setDefaultPort(port: number): void {
    this.defaultPort = port;
  }

  /**
   * Get port from environment variable or find available port
   */
  public async getServerPort(): Promise<number> {
    const envPort = process.env.PORT;
    
    if (envPort) {
      const port = parseInt(envPort, 10);
      if (await this.isPortAvailable(port)) {
        logger.info(`Using port from environment: ${port}`);
        return port;
      } else {
        logger.warn(`Port ${port} from environment is not available, finding alternative...`);
      }
    }

    return this.findAvailablePort();
  }

  /**
   * Create a port configuration for the application
   */
  public async createPortConfig(): Promise<{
    port: number;
    url: string;
    isDefault: boolean;
  }> {
    const port = await this.getServerPort();
    const isDefault = port === this.defaultPort;
    const url = `http://localhost:${port}`;

    return {
      port,
      url,
      isDefault
    };
  }

  /**
   * Save port configuration to a file for other processes
   */
  public async savePortConfig(port: number): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const configPath = path.join(process.cwd(), 'port-config.json');
    const config = {
      port,
      url: `http://localhost:${port}`,
      timestamp: new Date().toISOString(),
      pid: process.pid
    };

    try {
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      logger.info(`Port configuration saved to ${configPath}`);
    } catch (error) {
      logger.error('Failed to save port configuration:', error);
    }
  }

  /**
   * Load port configuration from file
   */
  public async loadPortConfig(): Promise<{ port: number; url: string } | null> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const configPath = path.join(process.cwd(), 'port-config.json');

    try {
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Verify the port is still available
      if (await this.isPortAvailable(config.port)) {
        return {
          port: config.port,
          url: config.url
        };
      } else {
        logger.warn(`Saved port ${config.port} is no longer available`);
        return null;
      }
    } catch (error) {
      // Config file doesn't exist or is invalid
      return null;
    }
  }

  /**
   * Clean up port configuration file
   */
  public async cleanupPortConfig(): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const configPath = path.join(process.cwd(), 'port-config.json');

    try {
      await fs.unlink(configPath);
      logger.info('Port configuration cleaned up');
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }
}

export const portManager = PortManager.getInstance();