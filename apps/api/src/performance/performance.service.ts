import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerformanceDto, UpdatePerformanceDto } from './dto';
import { performanceWithTeamsInclude } from '@repo/shared-types';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePerformanceDto) {
    return this.prisma.performance.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        posterImage: dto.posterImage ?? null,
        location: dto.location ?? null,
        startAt: dto.startAt ?? null,
        endAt: dto.endAt ?? null,
      },
    });
  }

  async findAll() {
    return this.prisma.performance.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const performance = await this.prisma.performance.findUnique({
      where: { id },
      include: performanceWithTeamsInclude,
    });

    if (!performance) {
      throw new NotFoundException('공연을 찾을 수 없습니다.');
    }

    return performance;
  }

  async update(id: number, dto: UpdatePerformanceDto) {
    const existing = await this.prisma.performance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('공연을 찾을 수 없습니다.');
    }

    return this.prisma.performance.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        posterImage: dto.posterImage,
        location: dto.location,
        startAt: dto.startAt,
        endAt: dto.endAt,
      },
      include: performanceWithTeamsInclude,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.performance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('공연을 찾을 수 없습니다.');
    }

    await this.prisma.performance.delete({
      where: { id },
    });

    return { message: '공연이 삭제되었습니다.' };
  }
}
