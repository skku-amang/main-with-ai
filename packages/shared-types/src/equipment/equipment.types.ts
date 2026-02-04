import type { Equipment } from '@repo/database';

export type { Equipment };

export const EquipCategoryEnum = [
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
] as const;

export type EquipCategoryType = (typeof EquipCategoryEnum)[number];
