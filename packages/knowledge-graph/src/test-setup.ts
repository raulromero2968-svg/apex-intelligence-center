/**
 * Jest Test Setup
 *
 * This file is run before each test file to set up the test environment.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
process.env.NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
process.env.NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'test-password';
process.env.NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';
process.env.FARA_ENDPOINT = process.env.FARA_ENDPOINT || 'https://api.example.com/fara';
process.env.FARA_API_KEY = process.env.FARA_API_KEY || 'test-api-key';

// Increase Jest timeout for integration tests
jest.setTimeout(30000);

// Mock console.error for cleaner test output (optional)
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress expected error messages during tests
    const message = args[0]?.toString() || '';
    if (
      message.includes('Neo4j connectivity check failed') ||
      message.includes('API error')
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
