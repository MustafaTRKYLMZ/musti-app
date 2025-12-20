module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/packages'],
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};