import { z } from 'zod';

export const GetRentalsSchema = z.object({
  type: z.enum(['room', 'item']).optional(),
  equipmentId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type GetRentals = z.infer<typeof GetRentalsSchema>;
