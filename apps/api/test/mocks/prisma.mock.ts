import { PrismaClient } from '@repo/database';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const createMockPrismaClient = (): MockPrismaClient => {
  return mockDeep<PrismaClient>();
};

export const resetMockPrismaClient = (mock: MockPrismaClient): void => {
  mockReset(mock);
};
