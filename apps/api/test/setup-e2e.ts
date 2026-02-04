// E2E test setup
// Uses the same database as development for simplicity
// In production, you would use a separate test database

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Global cleanup after all tests
afterAll(async () => {
  // Allow connections to close gracefully
  await new Promise((resolve) => setTimeout(resolve, 500));
});
