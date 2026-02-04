import { createZodDto } from 'nestjs-zod';
import { CreateTeamSchema } from '@repo/shared-types';

export class CreateTeamDto extends createZodDto(CreateTeamSchema) {}
