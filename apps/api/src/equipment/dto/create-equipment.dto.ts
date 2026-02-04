import { createZodDto } from 'nestjs-zod';
import { CreateEquipmentSchema } from '@repo/shared-types';

export class CreateEquipmentDto extends createZodDto(CreateEquipmentSchema) {}
