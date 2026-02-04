import { z } from 'zod';

export const CreateRentalSchema = z.object({
  equipmentId: z.number().int().positive('장비 ID는 양의 정수여야 합니다.'),
  title: z.string().min(1, '예약 제목은 필수입니다.'),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  userIds: z.array(z.number().int().positive()).min(1, '최소 1명의 사용자를 지정해야 합니다.'),
});

export type CreateRental = z.infer<typeof CreateRentalSchema>;
