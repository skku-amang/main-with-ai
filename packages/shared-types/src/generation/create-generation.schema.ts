import { z } from 'zod';

export const CreateGenerationSchema = z.object({
  order: z.number().int().positive('기수 번호는 양의 정수여야 합니다.'),
  leaderId: z.number().int().positive().nullable().optional(),
});

export type CreateGeneration = z.infer<typeof CreateGenerationSchema>;
