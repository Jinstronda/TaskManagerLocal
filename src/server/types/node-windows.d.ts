declare module 'node-windows' {
  export interface ServiceOptions {
    name: string;
    description: string;
    script: string;
    nodeOptions?: string[];
    env?: Array<{ name: string; value: string }>;
  }

  export class Service {
    constructor(options: ServiceOptions);
    install(): void;
    uninstall(): void;
    start(): void;
    stop(): void;
    on(event: string, callback: (error?: Error) => void): void;
  }
}