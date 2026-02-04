import { z } from 'zod';

export const LoginUserSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string().min(1, { message: '비밀번호를 입력해주세요.' }),
});

export type LoginUser = z.infer<typeof LoginUserSchema>;
