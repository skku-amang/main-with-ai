import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: '리프레시 토큰이 필요합니다.' }),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
