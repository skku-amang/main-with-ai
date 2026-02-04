import { z } from 'zod';

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1, { message: '이름은 비워둘 수 없습니다.' }).optional(),
    nickname: z.string().min(1, { message: '닉네임은 비워둘 수 없습니다.' }).optional(),
    bio: z.string().nullable().optional(),
    image: z.string().url('유효한 URL이어야 합니다.').nullable().optional(),
    generationId: z.number().int('기수 ID는 정수여야 합니다.').optional(),
    sessions: z.array(z.number().int('세션 ID는 정수여야 합니다.')).optional(),
  })
  .strict();

export type UpdateUser = z.infer<typeof UpdateUserSchema>;
