const { createJestConfig } = require('tsdx/dist/createJestConfig')
const jestCustomConfig = require('./jest.config.js')

module.exports = { ...createJestConfig(), ...jestCustomConfig }
