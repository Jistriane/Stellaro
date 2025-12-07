import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '<rootDir>/apps/backend',
      testRegex: '.*\\.spec\\.ts$',
      moduleFileExtensions: ['ts', 'js', 'json'],
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      collectCoverageFrom: ['src/**/*.(t|j)s'],
      coverageDirectory: '<rootDir>/apps/backend/coverage',
      globalTeardown: '<rootDir>/test/global-teardown.ts',
    },
  ],
};

export default config;
