import { createZodDto } from 'nestjs-zod';
import { UpdateEquipmentSchema } from '@repo/shared-types';

export class UpdateEquipmentDto extends createZodDto(UpdateEquipmentSchema) {}
