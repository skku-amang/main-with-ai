import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@repo/database';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaClient>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    nickname: 'testuser',
    isAdmin: false,
  };

  const mockGeneration = { id: 1, order: 1 };
  const mockSessions = [
    { id: 1, name: 'VOCAL' },
    { id: 2, name: 'GUITAR' },
  ];

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'Password123!',
      name: 'New User',
      nickname: 'newuser',
      generationId: 1,
      sessions: [1, 2],
    };

    it('should successfully register a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.generation.findUnique.mockResolvedValue(mockGeneration as never);
      prisma.session.findMany.mockResolvedValue(mockSessions as never);
      prisma.user.create.mockResolvedValue({
        id: 2,
        email: registerDto.email,
        name: registerDto.name,
        nickname: registerDto.nickname,
        isAdmin: false,
      } as never);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as never);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        '이미 등록된 이메일입니다.',
      );
    });

    it('should throw BadRequestException if generation does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.generation.findUnique.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        '존재하지 않는 기수입니다.',
      );
    });

    it('should throw BadRequestException if any session does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.generation.findUnique.mockResolvedValue(mockGeneration as never);
      prisma.session.findMany.mockResolvedValue([mockSessions[0]] as never);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        '존재하지 않는 세션이 포함되어 있습니다.',
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'Password123!' };

    it('should successfully login with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    });
  });

  describe('refreshToken', () => {
    const refreshDto = { refreshToken: 'valid-refresh-token' };

    it('should return new tokens for valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 1 } as never);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        nickname: 'testuser',
        isAdmin: false,
      } as never);

      const result = await service.refreshToken(refreshDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        '유효하지 않은 리프레시 토큰입니다.',
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 999 } as never);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
