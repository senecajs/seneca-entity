module.exports = {
  transform: {
    "^.+\\.tsx?$": ["esbuild-jest", {sourcemap:true}]
  },
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  watchPathIgnorePatterns: ['dist\\/'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageProvider: 'v8',
};
