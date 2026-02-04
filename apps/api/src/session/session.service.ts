import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto, UpdateSessionDto } from './dto';
import { sessionWithLeaderInclude } from '@repo/shared-types';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSessionDto) {
    const existing = await this.prisma.session.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('이미 존재하는 세션입니다.');
    }

    return this.prisma.session.create({
      data: {
        name: dto.name,
        icon: dto.icon ?? null,
        leaderId: dto.leaderId ?? null,
      },
      include: sessionWithLeaderInclude,
    });
  }

  async findAll() {
    return this.prisma.session.findMany({
      include: sessionWithLeaderInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: sessionWithLeaderInclude,
    });

    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }

    return session;
  }

  async update(id: number, dto: UpdateSessionDto) {
    const existing = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }

    return this.prisma.session.update({
      where: { id },
      data: {
        icon: dto.icon,
        leaderId: dto.leaderId,
      },
      include: sessionWithLeaderInclude,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }

    await this.prisma.session.delete({
      where: { id },
    });

    return { message: '세션이 삭제되었습니다.' };
  }
}
