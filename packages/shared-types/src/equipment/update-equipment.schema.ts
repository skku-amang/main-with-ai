import { z } from 'zod';
import { EquipCategorySchema } from './create-equipment.schema';

export const UpdateEquipmentSchema = z.object({
  brand: z.string().min(1, '브랜드는 필수입니다.').optional(),
  model: z.string().min(1, '모델명은 필수입니다.').optional(),
  category: EquipCategorySchema.optional(),
  isAvailable: z.boolean().optional(),
  description: z.string().nullable().optional(),
  image: z.string().url('유효한 URL이어야 합니다.').nullable().optional(),
});

export type UpdateEquipment = z.infer<typeof UpdateEquipmentSchema>;
