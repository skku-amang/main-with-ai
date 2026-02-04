import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto';
import {
  basicUserSelector,
  publicUserSelector,
  fullUserSelector,
} from '@repo/shared-types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: basicUserSelector,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelector,
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async findProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: fullUserSelector,
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto, currentUserId: number, isAdmin: boolean) {
    if (id !== currentUserId && !isAdmin) {
      throw new ForbiddenException('본인의 정보만 수정할 수 있습니다.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const updateData: Parameters<typeof this.prisma.user.update>[0]['data'] = {
      name: dto.name,
      nickname: dto.nickname,
      bio: dto.bio,
      image: dto.image,
      generationId: dto.generationId,
    };

    if (dto.sessions !== undefined) {
      updateData.sessions = {
        set: dto.sessions.map((id) => ({ id })),
      };
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: fullUserSelector,
    });
  }

  async remove(id: number, currentUserId: number, isAdmin: boolean) {
    if (id !== currentUserId && !isAdmin) {
      throw new ForbiddenException('본인의 계정만 삭제할 수 있습니다.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: '사용자가 삭제되었습니다.' };
  }
}
