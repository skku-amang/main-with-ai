import { createZodDto } from 'nestjs-zod';
import { LoginUserSchema } from '@repo/shared-types';

export class LoginDto extends createZodDto(LoginUserSchema) {}
