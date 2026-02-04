import type { Prisma, Performance } from '@repo/database';
import { teamWithBasicUsersInclude } from '../team/team.types';

export type { Performance };

export const performanceWithTeamsInclude = {
  teams: {
    include: teamWithBasicUsersInclude,
  },
} satisfies Prisma.PerformanceInclude;

export type PerformanceList = Performance[];

export type PerformanceDetail = Prisma.PerformanceGetPayload<{
  include: typeof performanceWithTeamsInclude;
}>;
