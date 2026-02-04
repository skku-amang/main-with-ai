import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testUser = {
    email: testEmail,
    password: testPassword,
    name: 'E2E Test User',
    nickname: `e2euser${Date.now()}`,
  };

  let generationId: number;
  let sessionId: number;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    prisma = app.get(PrismaService);
    await app.init();

    // Get or create test generation and session
    const generation = await prisma.generation.findFirst();
    const session = await prisma.session.findFirst();

    if (!generation || !session) {
      throw new Error(
        'Database must have at least one generation and session. Run seed first.',
      );
    }

    generationId = generation.id;
    sessionId = session.id;
  });

  afterAll(async () => {
    // Cleanup: delete test user if created
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          ...testUser,
          generationId,
          sessions: [sessionId],
        })
        .expect(201);

      expect(response.body.isSuccess).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data.user.email).toBe(testEmail);

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should return 409 for duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          ...testUser,
          generationId,
          sessions: [sessionId],
        })
        .expect(409);

      expect(response.body.isSuccess).toBe(false);
      expect(response.body.error.status).toBe(409);
      expect(response.body.error.detail).toContain('이미 등록된 이메일');
    });

    it('should return 400 for invalid generation', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: `invalid-gen-${Date.now()}@example.com`,
          password: testPassword,
          name: 'Test',
          nickname: `invalidgen${Date.now()}`,
          generationId: 99999,
          sessions: [sessionId],
        })
        .expect(400);

      expect(response.body.isSuccess).toBe(false);
      expect(response.body.error.detail).toContain('존재하지 않는 기수');
    });

    it('should return 400 for invalid session', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: `invalid-sess-${Date.now()}@example.com`,
          password: testPassword,
          name: 'Test',
          nickname: `invalidsess${Date.now()}`,
          generationId,
          sessions: [99999],
        })
        .expect(400);

      expect(response.body.isSuccess).toBe(false);
      expect(response.body.error.detail).toContain('존재하지 않는 세션');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.isSuccess).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(testEmail);

      // Update tokens for subsequent tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.isSuccess).toBe(false);
      expect(response.body.error.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);

      expect(response.body.isSuccess).toBe(false);
      expect(response.body.error.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.isSuccess).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.isSuccess).toBe(false);
      expect(response.body.error.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.isSuccess).toBe(true);
      expect(response.body.data.email).toBe(testEmail);
      expect(response.body.data.name).toBe(testUser.name);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
