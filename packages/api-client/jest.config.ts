import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: {
    '^@repo/shared-types$': '<rootDir>/../../shared-types/dist',
  },
  testTimeout: 30000,
};

export default config;
