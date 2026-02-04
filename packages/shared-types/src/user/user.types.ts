import type { Prisma, User } from '@repo/database';

export type { User };

// Basic user info (for lists)
export const basicUserSelector = {
  id: true,
  name: true,
  image: true,
} satisfies Prisma.UserSelect;

// Public user info (for details)
export const publicUserSelector = {
  ...basicUserSelector,
  nickname: true,
  bio: true,
  generation: {
    select: {
      id: true,
      order: true,
    },
  },
  sessions: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.UserSelect;

// Full user info (for profile)
export const fullUserSelector = {
  ...publicUserSelector,
  email: true,
  isAdmin: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

// Type extraction
export type BasicUser = Prisma.UserGetPayload<{
  select: typeof basicUserSelector;
}>;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelector;
}>;

export type FullUser = Prisma.UserGetPayload<{
  select: typeof fullUserSelector;
}>;
