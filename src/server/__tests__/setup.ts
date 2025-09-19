import { DatabaseManager } from '../database/DatabaseManager';

// Setup test database
beforeAll(async () => {
  // Use in-memory database for tests
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Clean up database connection
  const dbManager = DatabaseManager.getInstance();
  dbManager.close();
});

beforeEach(async () => {
  // Reset database state before each test
  const dbManager = DatabaseManager.getInstance();
  if (!dbManager.isHealthy()) {
    await dbManager.initialize();
  }
});

describe('Test Setup', () => {
  test('should setup test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});