import { z } from 'zod';
import { TeamSessionSchema } from './create-team.schema';

export const UpdateTeamSchema = z.object({
  name: z.string().min(1, '팀 이름은 필수입니다.').optional(),
  description: z.string().nullable().optional(),
  posterImage: z.string().url('포스터 이미지 URL은 유효한 URL이어야 합니다.').nullable().optional(),
  songName: z.string().min(1, '노래 이름은 필수입니다.').optional(),
  songArtist: z.string().min(1, '노래 아티스트는 필수입니다.').optional(),
  isFreshmenFixed: z.boolean().optional(),
  isSelfMade: z.boolean().optional(),
  songYoutubeVideoUrl: z
    .string()
    .url('유튜브 영상 URL은 유효한 URL이어야 합니다.')
    .nullable()
    .optional(),
  memberSessions: z.array(TeamSessionSchema).optional(),
});

export type UpdateTeam = z.infer<typeof UpdateTeamSchema>;
