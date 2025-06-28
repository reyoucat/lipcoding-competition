module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'database/**/*.js',
    'middleware/**/*.js',
    '!node_modules/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // Run tests in sequence to avoid database conflicts
  maxWorkers: 1,
  // Increase timeout for slower tests
  testTimeout: 30000
};
