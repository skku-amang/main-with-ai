import { z } from 'zod';

export const UpdateRentalSchema = z.object({
  equipmentId: z.number().int().positive('장비 ID는 양의 정수여야 합니다.').optional(),
  title: z.string().min(1, '예약 제목은 필수입니다.').optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  userIds: z.array(z.number().int().positive()).min(1, '최소 1명의 사용자를 지정해야 합니다.').optional(),
});

export type UpdateRental = z.infer<typeof UpdateRentalSchema>;
