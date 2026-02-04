import { z } from 'zod';

export const SessionNameEnum = z.enum([
  'VOCAL',
  'GUITAR',
  'BASS',
  'SYNTH',
  'DRUM',
  'STRINGS',
  'WINDS',
]);

export const CreateSessionSchema = z.object({
  name: SessionNameEnum,
  icon: z.string().nullable().optional(),
  leaderId: z.number().int().positive().nullable().optional(),
});

export type CreateSession = z.infer<typeof CreateSessionSchema>;
