import type { Prisma, Generation } from '@repo/database';
import { basicUserSelector } from '../user/user.types';

export type { Generation };

export const generationWithLeaderInclude = {
  leader: {
    select: basicUserSelector,
  },
} satisfies Prisma.GenerationInclude;

export type GenerationWithLeader = Prisma.GenerationGetPayload<{
  include: typeof generationWithLeaderInclude;
}>;
