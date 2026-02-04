import { z } from 'zod';

export const TeamApplicationItemSchema = z.object({
  sessionId: z.number().int().positive(),
  index: z.number().int().positive(),
});

export const TeamApplicationSchema = z.array(TeamApplicationItemSchema);

export type TeamApplicationItem = z.infer<typeof TeamApplicationItemSchema>;
export type TeamApplication = z.infer<typeof TeamApplicationSchema>;
