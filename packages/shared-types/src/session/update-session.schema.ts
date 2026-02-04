import { z } from 'zod';

export const UpdateSessionSchema = z.object({
  icon: z.string().nullable().optional(),
  leaderId: z.number().int().positive().nullable().optional(),
});

export type UpdateSession = z.infer<typeof UpdateSessionSchema>;
