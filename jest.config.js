module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  // Only run unit tests by default (mock-based, no real API calls)
  testMatch: ['**/test/unit/**/*.test.ts'],
  // Explicitly exclude tests that make real API calls
  testPathIgnorePatterns: [
    '/node_modules/',
    '/test/integration/',
    '/test/e2e/',
    '/test/performance/',
  ],
  collectCoverageFrom: [
    'nodes/**/*.ts',
    'credentials/**/*.ts',
    'utils/**/*.ts',
    '!**/*.node.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
};
