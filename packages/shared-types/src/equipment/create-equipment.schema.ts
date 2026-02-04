import { z } from 'zod';

export const EquipCategorySchema = z.enum([
  'ROOM',
  'SYNTHESIZER',
  'MICROPHONE',
  'GUITAR',
  'BASS',
  'DRUM',
  'AUDIO_INTERFACE',
  'CABLE',
  'AMPLIFIER',
  'SPEAKER',
  'MIXER',
  'ETC',
]);

export const CreateEquipmentSchema = z.object({
  brand: z.string().min(1, '브랜드는 필수입니다.'),
  model: z.string().min(1, '모델명은 필수입니다.'),
  category: EquipCategorySchema,
  isAvailable: z.boolean().default(true),
  description: z.string().nullable().optional(),
  image: z.string().url('유효한 URL이어야 합니다.').nullable().optional(),
});

export type CreateEquipment = z.infer<typeof CreateEquipmentSchema>;
