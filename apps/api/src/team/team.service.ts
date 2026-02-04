import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto, TeamApplicationDto } from './dto';
import {
  teamWithBasicUsersInclude,
  teamWithPublicUsersInclude,
} from '@repo/shared-types';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeamDto) {
    // Verify performance exists
    const performance = await this.prisma.performance.findUnique({
      where: { id: dto.performanceId },
    });

    if (!performance) {
      throw new BadRequestException('존재하지 않는 공연입니다.');
    }

    // Verify leader exists
    const leader = await this.prisma.user.findUnique({
      where: { id: dto.leaderId },
    });

    if (!leader) {
      throw new BadRequestException('존재하지 않는 팀 리더입니다.');
    }

    return this.prisma.team.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        posterImage: dto.posterImage ?? null,
        songName: dto.songName,
        songArtist: dto.songArtist,
        isFreshmenFixed: dto.isFreshmenFixed,
        isSelfMade: dto.isSelfMade,
        songYoutubeVideoUrl: dto.songYoutubeVideoUrl ?? null,
        leader: { connect: { id: dto.leaderId } },
        Performance: { connect: { id: dto.performanceId } },
        teamSessions: {
          create: dto.memberSessions.map((session) => ({
            session: { connect: { id: session.sessionId } },
            capacity: session.capacity,
            members: {
              create: session.members.map((member) => ({
                user: { connect: { id: member.userId } },
                index: member.index,
              })),
            },
          })),
        },
      },
      include: teamWithPublicUsersInclude,
    });
  }

  async findAll(performanceId?: number) {
    const where = performanceId ? { performanceId } : undefined;

    return this.prisma.team.findMany({
      where,
      include: teamWithBasicUsersInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: teamWithPublicUsersInclude,
    });

    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    return team;
  }

  async update(
    id: number,
    dto: UpdateTeamDto,
    currentUserId: number,
    isAdmin: boolean,
  ) {
    const existing = await this.prisma.team.findUnique({
      where: { id },
      include: { teamSessions: true },
    });

    if (!existing) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    // Only leader or admin can update
    if (existing.leaderId !== currentUserId && !isAdmin) {
      throw new ForbiddenException('팀 리더만 수정할 수 있습니다.');
    }

    // If memberSessions is provided, delete existing and recreate
    if (dto.memberSessions !== undefined) {
      // Delete existing team sessions and members
      await this.prisma.teamMember.deleteMany({
        where: {
          teamSession: {
            teamId: id,
          },
        },
      });

      await this.prisma.teamSession.deleteMany({
        where: { teamId: id },
      });
    }

    return this.prisma.team.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        posterImage: dto.posterImage,
        songName: dto.songName,
        songArtist: dto.songArtist,
        isFreshmenFixed: dto.isFreshmenFixed,
        isSelfMade: dto.isSelfMade,
        songYoutubeVideoUrl: dto.songYoutubeVideoUrl,
        ...(dto.memberSessions && {
          teamSessions: {
            create: dto.memberSessions.map((session) => ({
              session: { connect: { id: session.sessionId } },
              capacity: session.capacity,
              members: {
                create: session.members.map((member) => ({
                  user: { connect: { id: member.userId } },
                  index: member.index,
                })),
              },
            })),
          },
        }),
      },
      include: teamWithPublicUsersInclude,
    });
  }

  async remove(id: number, currentUserId: number, isAdmin: boolean) {
    const existing = await this.prisma.team.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    // Only leader or admin can delete
    if (existing.leaderId !== currentUserId && !isAdmin) {
      throw new ForbiddenException('팀 리더만 삭제할 수 있습니다.');
    }

    await this.prisma.team.delete({
      where: { id },
    });

    return { message: '팀이 삭제되었습니다.' };
  }

  async applyToTeam(
    teamId: number,
    userId: number,
    dto: TeamApplicationDto,
  ) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamSessions: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    // Validate all session/index combinations exist and have capacity
    for (const app of dto.applications) {
      const teamSession = team.teamSessions.find(
        (ts) => ts.sessionId === app.sessionId,
      );

      if (!teamSession) {
        throw new BadRequestException(`세션 ${app.sessionId}이(가) 이 팀에 없습니다.`);
      }

      const existingMemberAtIndex = teamSession.members.find(
        (m) => m.index === app.index,
      );

      if (existingMemberAtIndex) {
        throw new BadRequestException(
          `세션 ${app.sessionId}의 ${app.index}번 자리는 이미 채워졌습니다.`,
        );
      }

      if (app.index > teamSession.capacity) {
        throw new BadRequestException(
          `세션 ${app.sessionId}의 정원(${teamSession.capacity})을 초과했습니다.`,
        );
      }
    }

    // Add member to team sessions
    await Promise.all(
      dto.applications.map(async (app) => {
        const teamSession = team.teamSessions.find(
          (ts) => ts.sessionId === app.sessionId,
        )!;

        return this.prisma.teamMember.create({
          data: {
            teamSession: { connect: { id: teamSession.id } },
            user: { connect: { id: userId } },
            index: app.index,
          },
        });
      }),
    );

    return this.findOne(teamId);
  }

  async leaveTeam(teamId: number, userId: number) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamSessions: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    // Find all member entries for this user
    const memberEntries = team.teamSessions.flatMap((ts) =>
      ts.members.filter((m) => m.userId === userId),
    );

    if (memberEntries.length === 0) {
      throw new BadRequestException('이 팀의 멤버가 아닙니다.');
    }

    // Delete all member entries
    await this.prisma.teamMember.deleteMany({
      where: {
        id: { in: memberEntries.map((m) => m.id) },
      },
    });

    return this.findOne(teamId);
  }
}
