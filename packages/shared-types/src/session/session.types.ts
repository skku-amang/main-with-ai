import type { Prisma, Session } from '@repo/database';
import { basicUserSelector } from '../user/user.types';

export type { Session };

export const sessionWithLeaderInclude = {
  leader: {
    select: basicUserSelector,
  },
} satisfies Prisma.SessionInclude;

export type SessionWithLeader = Prisma.SessionGetPayload<{
  include: typeof sessionWithLeaderInclude;
}>;
