import { createZodDto } from 'nestjs-zod';
import { CreateUserSchema } from '@repo/shared-types';

export class RegisterDto extends createZodDto(CreateUserSchema) {}
