/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './tests',
  moduleNameMapper: {
    '^@backend/(.*)$': '<rootDir>/../src/backend/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.test.json' }],
  },
}
