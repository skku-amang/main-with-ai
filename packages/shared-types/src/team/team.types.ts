import type { Prisma, Team } from '@repo/database';
import { basicUserSelector, publicUserSelector } from '../user/user.types';

export type { Team };

// Basic team info (for lists)
export const teamWithBasicUsersInclude = {
  leader: {
    select: basicUserSelector,
  },
  teamSessions: {
    include: {
      session: true,
      members: {
        include: {
          user: {
            select: basicUserSelector,
          },
        },
        orderBy: {
          index: 'asc' as const,
        },
      },
    },
  },
} satisfies Prisma.TeamInclude;

// Detailed team info (for detail page)
export const teamWithPublicUsersInclude = {
  leader: {
    select: publicUserSelector,
  },
  teamSessions: {
    include: {
      session: true,
      members: {
        include: {
          user: {
            select: publicUserSelector,
          },
        },
        orderBy: {
          index: 'asc' as const,
        },
      },
    },
  },
} satisfies Prisma.TeamInclude;

// Type extraction
export type TeamList = Prisma.TeamGetPayload<{
  include: typeof teamWithBasicUsersInclude;
}>[];

export type TeamDetail = Prisma.TeamGetPayload<{
  include: typeof teamWithPublicUsersInclude;
}>;
