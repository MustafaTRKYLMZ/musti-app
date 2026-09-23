module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/packages'],
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        jsx: 'react-jsx',
      },
    }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};