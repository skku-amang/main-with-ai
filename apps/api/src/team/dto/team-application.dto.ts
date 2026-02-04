import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { TeamApplicationSchema } from '@repo/shared-types';

// Wrap array in object for DTO
const TeamApplicationDtoSchema = z.object({
  applications: TeamApplicationSchema,
});

export class TeamApplicationDto extends createZodDto(TeamApplicationDtoSchema) {}
