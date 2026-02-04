import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGenerationDto, UpdateGenerationDto } from './dto';
import { generationWithLeaderInclude } from '@repo/shared-types';

@Injectable()
export class GenerationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGenerationDto) {
    const existing = await this.prisma.generation.findUnique({
      where: { order: dto.order },
    });

    if (existing) {
      throw new ConflictException('이미 존재하는 기수 번호입니다.');
    }

    return this.prisma.generation.create({
      data: {
        order: dto.order,
        leaderId: dto.leaderId ?? null,
      },
      include: generationWithLeaderInclude,
    });
  }

  async findAll() {
    return this.prisma.generation.findMany({
      include: generationWithLeaderInclude,
      orderBy: { order: 'desc' },
    });
  }

  async findOne(id: number) {
    const generation = await this.prisma.generation.findUnique({
      where: { id },
      include: generationWithLeaderInclude,
    });

    if (!generation) {
      throw new NotFoundException('기수를 찾을 수 없습니다.');
    }

    return generation;
  }

  async update(id: number, dto: UpdateGenerationDto) {
    const existing = await this.prisma.generation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('기수를 찾을 수 없습니다.');
    }

    if (dto.order !== undefined && dto.order !== existing.order) {
      const orderConflict = await this.prisma.generation.findUnique({
        where: { order: dto.order },
      });

      if (orderConflict) {
        throw new ConflictException('이미 존재하는 기수 번호입니다.');
      }
    }

    return this.prisma.generation.update({
      where: { id },
      data: {
        order: dto.order,
        leaderId: dto.leaderId,
      },
      include: generationWithLeaderInclude,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.generation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('기수를 찾을 수 없습니다.');
    }

    await this.prisma.generation.delete({
      where: { id },
    });

    return { message: '기수가 삭제되었습니다.' };
  }
}
