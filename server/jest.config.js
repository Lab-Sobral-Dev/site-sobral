module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['./tests/setup-env.js'],
  verbose: true,
  moduleNameMapper: {
    '^psd$': '<rootDir>/tests/__mocks__/psd.js',
  },
};
