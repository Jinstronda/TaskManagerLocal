module.exports = {
  preset: 'ts-jest',
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      roots: ['<rootDir>/src/server'],
      testMatch: [
        '<rootDir>/src/server/**/__tests__/**/*.ts',
        '<rootDir>/src/server/**/?(*.)+(spec|test).ts'
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/src/server/__tests__/setup.ts'],
      collectCoverageFrom: [
        'src/server/**/*.ts',
        '!src/server/**/*.d.ts',
      ],
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src/client'],
      testMatch: [
        '<rootDir>/src/client/**/__tests__/**/*.ts',
        '<rootDir>/src/client/**/__tests__/**/*.tsx',
        '<rootDir>/src/client/**/?(*.)+(spec|test).ts',
        '<rootDir>/src/client/**/?(*.)+(spec|test).tsx'
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest',
        '^.+\\.tsx$': 'ts-jest',
      },
      globals: {
        'ts-jest': {
          tsconfig: {
            jsx: 'react-jsx',
          },
        },
      },
      setupFilesAfterEnv: ['<rootDir>/src/client/src/__tests__/setup.ts'],
      collectCoverageFrom: [
        'src/client/src/**/*.ts',
        'src/client/src/**/*.tsx',
        '!src/client/src/**/*.d.ts',
      ],

    }
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};