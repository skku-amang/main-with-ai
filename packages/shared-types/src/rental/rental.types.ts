import type { Prisma, EquipmentRental } from '@repo/database';
import { basicUserSelector } from '../user/user.types';

export type { EquipmentRental };

export const rentalWithDetailsInclude = {
  equipment: true,
  users: {
    select: basicUserSelector,
  },
} satisfies Prisma.EquipmentRentalInclude;

export type RentalWithDetails = Prisma.EquipmentRentalGetPayload<{
  include: typeof rentalWithDetailsInclude;
}>;
