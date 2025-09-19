// Client-side test setup

// Mock window object for browser APIs
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: class MockNotification {
    static permission = 'granted';
    static requestPermission = jest.fn().mockResolvedValue('granted');
    
    constructor(title: string, options?: NotificationOptions) {
      // Mock notification instance
    }
    
    onclick = null;
    close = jest.fn();
  },
  writable: true,
});

// Mock fetch API
global.fetch = jest.fn();

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
  writable: true,
});

// Mock document visibility API
Object.defineProperty(document, 'hidden', {
  value: false,
  writable: true,
});

Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});