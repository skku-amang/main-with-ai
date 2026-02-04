import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentalDto, UpdateRentalDto } from './dto';
import { rentalWithDetailsInclude } from '@repo/shared-types';
import { EquipCategory, Prisma } from '@repo/database';

@Injectable()
export class RentalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRentalDto) {
    // Verify equipment exists and is available
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
    });

    if (!equipment) {
      throw new BadRequestException('존재하지 않는 장비입니다.');
    }

    if (!equipment.isAvailable) {
      throw new BadRequestException('사용 불가능한 장비입니다.');
    }

    // Verify all users exist
    const users = await this.prisma.user.findMany({
      where: { id: { in: dto.userIds } },
    });

    if (users.length !== dto.userIds.length) {
      throw new BadRequestException('존재하지 않는 사용자가 포함되어 있습니다.');
    }

    // Check for time conflicts
    const conflictingRental = await this.prisma.equipmentRental.findFirst({
      where: {
        equipmentId: dto.equipmentId,
        OR: [
          {
            startAt: { lte: dto.startAt },
            endAt: { gt: dto.startAt },
          },
          {
            startAt: { lt: dto.endAt },
            endAt: { gte: dto.endAt },
          },
          {
            startAt: { gte: dto.startAt },
            endAt: { lte: dto.endAt },
          },
        ],
      },
    });

    if (conflictingRental) {
      throw new BadRequestException('해당 시간에 이미 예약이 있습니다.');
    }

    return this.prisma.equipmentRental.create({
      data: {
        equipment: { connect: { id: dto.equipmentId } },
        title: dto.title,
        startAt: dto.startAt,
        endAt: dto.endAt,
        users: {
          connect: dto.userIds.map((id) => ({ id })),
        },
      },
      include: rentalWithDetailsInclude,
    });
  }

  async findAll(filters: {
    type?: 'room' | 'item';
    equipmentId?: number;
    from?: Date;
    to?: Date;
  }) {
    const where: Prisma.EquipmentRentalWhereInput = {};

    if (filters.equipmentId) {
      where.equipmentId = filters.equipmentId;
    }

    if (filters.type) {
      where.equipment = {
        category: filters.type === 'room' ? EquipCategory.ROOM : { not: EquipCategory.ROOM },
      };
    }

    if (filters.from || filters.to) {
      where.AND = [];
      if (filters.from) {
        where.AND.push({ endAt: { gte: filters.from } });
      }
      if (filters.to) {
        where.AND.push({ startAt: { lte: filters.to } });
      }
    }

    return this.prisma.equipmentRental.findMany({
      where,
      include: rentalWithDetailsInclude,
      orderBy: { startAt: 'asc' },
    });
  }

  async findOne(id: number) {
    const rental = await this.prisma.equipmentRental.findUnique({
      where: { id },
      include: rentalWithDetailsInclude,
    });

    if (!rental) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    return rental;
  }

  async update(
    id: number,
    dto: UpdateRentalDto,
    currentUserId: number,
    isAdmin: boolean,
  ) {
    const existing = await this.prisma.equipmentRental.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!existing) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    // Only users in the rental or admin can update
    const isUserInRental = existing.users.some((u) => u.id === currentUserId);
    if (!isUserInRental && !isAdmin) {
      throw new ForbiddenException('예약 참여자만 수정할 수 있습니다.');
    }

    const equipmentId = dto.equipmentId ?? existing.equipmentId;
    const startAt = dto.startAt ?? existing.startAt;
    const endAt = dto.endAt ?? existing.endAt;

    // Check for time conflicts (exclude current rental)
    if (dto.equipmentId || dto.startAt || dto.endAt) {
      const conflictingRental = await this.prisma.equipmentRental.findFirst({
        where: {
          id: { not: id },
          equipmentId,
          OR: [
            {
              startAt: { lte: startAt },
              endAt: { gt: startAt },
            },
            {
              startAt: { lt: endAt },
              endAt: { gte: endAt },
            },
            {
              startAt: { gte: startAt },
              endAt: { lte: endAt },
            },
          ],
        },
      });

      if (conflictingRental) {
        throw new BadRequestException('해당 시간에 이미 예약이 있습니다.');
      }
    }

    const updateData: Prisma.EquipmentRentalUpdateInput = {
      title: dto.title,
      startAt: dto.startAt,
      endAt: dto.endAt,
    };

    if (dto.equipmentId) {
      updateData.equipment = { connect: { id: dto.equipmentId } };
    }

    if (dto.userIds) {
      updateData.users = {
        set: dto.userIds.map((id) => ({ id })),
      };
    }

    return this.prisma.equipmentRental.update({
      where: { id },
      data: updateData,
      include: rentalWithDetailsInclude,
    });
  }

  async remove(id: number, currentUserId: number, isAdmin: boolean) {
    const existing = await this.prisma.equipmentRental.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!existing) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    // Only users in the rental or admin can delete
    const isUserInRental = existing.users.some((u) => u.id === currentUserId);
    if (!isUserInRental && !isAdmin) {
      throw new ForbiddenException('예약 참여자만 삭제할 수 있습니다.');
    }

    await this.prisma.equipmentRental.delete({
      where: { id },
    });

    return { message: '예약이 삭제되었습니다.' };
  }

  async findMyRentals(userId: number) {
    return this.prisma.equipmentRental.findMany({
      where: {
        users: {
          some: { id: userId },
        },
      },
      include: rentalWithDetailsInclude,
      orderBy: { startAt: 'desc' },
    });
  }
}
