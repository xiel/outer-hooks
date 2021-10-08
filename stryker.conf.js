/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
  testRunner: 'jest',
  mutator: 'typescript',
  reporters: ['progress', 'clear-text', 'html'],
  coverageAnalysis: 'off',
  jest: {
    projectType: 'custom',
    configFile: 'tsdxJestConfig.js',
  },
}
