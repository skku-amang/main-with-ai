import { z } from 'zod';
import { PASSWORD_REGEX } from '../constants/regex';

export const passwordField = z
  .string()
  .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  .regex(PASSWORD_REGEX, {
    message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.',
  });

export const CreateUserSchema = z
  .object({
    email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
    password: passwordField,
    name: z.string().min(1, { message: '이름은 비워둘 수 없습니다.' }),
    nickname: z.string().min(1, { message: '닉네임은 비워둘 수 없습니다.' }),
    generationId: z
      .number({ invalid_type_error: '기수 ID는 숫자여야 합니다.' })
      .int('기수 ID는 정수여야 합니다.'),
    sessions: z
      .array(z.number().int('세션 ID는 정수여야 합니다.'))
      .min(1, { message: '최소 하나의 세션을 선택해야 합니다.' }),
  })
  .strict();

export type CreateUser = z.infer<typeof CreateUserSchema>;
