import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { JwtPayload, AuthResponse, AuthTokens } from '@repo/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('이미 등록된 이메일입니다.');
    }

    const generation = await this.prisma.generation.findUnique({
      where: { id: dto.generationId },
    });

    if (!generation) {
      throw new BadRequestException('존재하지 않는 기수입니다.');
    }

    const sessions = await this.prisma.session.findMany({
      where: { id: { in: dto.sessions } },
    });

    if (sessions.length !== dto.sessions.length) {
      throw new BadRequestException('존재하지 않는 세션이 포함되어 있습니다.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        nickname: dto.nickname,
        generationId: dto.generationId,
        sessions: {
          connect: dto.sessions.map((id) => ({ id })),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        isAdmin: true,
      },
    });

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        password: true,
        isAdmin: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const { password: _, ...userWithoutPassword } = user;
    const tokens = await this.generateTokens(userWithoutPassword);

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
          isAdmin: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
  }

  private async generateTokens(user: {
    id: number;
    email: string;
    name: string;
    isAdmin: boolean;
  }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };

    const expiresIn = 3600; // 1 hour

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: `${expiresIn}s`,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}
