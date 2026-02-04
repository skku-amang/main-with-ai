import { z } from 'zod';

export const CreatePerformanceSchema = z.object({
  name: z.string().min(1, '공연 이름은 필수입니다.'),
  description: z.string().nullable().optional(),
  posterImage: z.string().url('포스터 이미지 URL은 유효한 URL이어야 합니다.').nullable().optional(),
  location: z.string().nullable().optional(),
  startAt: z.coerce.date().nullable().optional(),
  endAt: z.coerce.date().nullable().optional(),
});

export type CreatePerformance = z.infer<typeof CreatePerformanceSchema>;
