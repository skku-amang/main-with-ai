import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto, UpdateEquipmentDto } from './dto';
import { EquipCategory } from '@repo/database';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEquipmentDto) {
    return this.prisma.equipment.create({
      data: {
        brand: dto.brand,
        model: dto.model,
        category: dto.category as EquipCategory,
        isAvailable: dto.isAvailable ?? true,
        description: dto.description ?? null,
        image: dto.image ?? null,
      },
    });
  }

  async findAll(category?: EquipCategory, available?: boolean) {
    const where: {
      category?: EquipCategory;
      isAvailable?: boolean;
    } = {};

    if (category) {
      where.category = category;
    }

    if (available !== undefined) {
      where.isAvailable = available;
    }

    return this.prisma.equipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException('장비를 찾을 수 없습니다.');
    }

    return equipment;
  }

  async update(id: number, dto: UpdateEquipmentDto) {
    const existing = await this.prisma.equipment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('장비를 찾을 수 없습니다.');
    }

    return this.prisma.equipment.update({
      where: { id },
      data: {
        brand: dto.brand,
        model: dto.model,
        category: dto.category as EquipCategory | undefined,
        isAvailable: dto.isAvailable,
        description: dto.description,
        image: dto.image,
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.equipment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('장비를 찾을 수 없습니다.');
    }

    await this.prisma.equipment.delete({
      where: { id },
    });

    return { message: '장비가 삭제되었습니다.' };
  }
}
