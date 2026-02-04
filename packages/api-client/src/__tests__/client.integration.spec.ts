/**
 * API Client Integration Tests
 *
 * These tests verify that the ApiClient works correctly with the actual API server.
 * Prerequisites:
 * - Database must be running with seed data
 * - API server must be running on http://localhost:3001
 *
 * Run: pnpm --filter @repo/api-client test
 */

import { ApiClient } from '../client';
import { ApiError, AuthError, NotFoundError, ConflictError } from '../errors';
import type { CreateUser, FullUser, AuthResponse } from '@repo/shared-types';

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';

describe('ApiClient Integration Tests', () => {
  let client: ApiClient;
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  // Unique test data to avoid conflicts
  const timestamp = Date.now();
  const testUser: CreateUser = {
    email: `integration-test-${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: 'Integration Test User',
    nickname: `inttest${timestamp}`,
    generationId: 1, // Will be updated in beforeAll
    sessions: [1], // Will be updated in beforeAll
  };

  beforeAll(async () => {
    client = new ApiClient({
      baseUrl: API_BASE_URL,
      getAccessToken: () => accessToken,
      onAuthError: () => {
        accessToken = null;
        refreshToken = null;
      },
    });

    // Get valid generation and session IDs from the server
    try {
      const generations = await client.getGenerations();
      const sessions = await client.getSessions();

      if (generations.length > 0) {
        testUser.generationId = generations[0].id;
      }
      if (sessions.length > 0) {
        testUser.sessions = [sessions[0].id];
      }
    } catch (error) {
      console.warn(
        'Could not fetch generations/sessions. Using default IDs.',
        error,
      );
    }
  });

  describe('Auth Flow', () => {
    describe('signup', () => {
      it('should successfully register a new user', async () => {
        const result = await client.signup(testUser);

        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
        expect(result).toHaveProperty('expiresIn');
        expect(result).toHaveProperty('user');
        expect(result.user.email).toBe(testUser.email);
        expect(result.user.name).toBe(testUser.name);
        expect(result.user).not.toHaveProperty('password');

        // Save tokens for subsequent tests
        accessToken = result.accessToken;
        refreshToken = result.refreshToken;
      });

      it('should throw ConflictError for duplicate email', async () => {
        await expect(client.signup(testUser)).rejects.toThrow(ConflictError);
      });
    });

    describe('login', () => {
      it('should successfully login with valid credentials', async () => {
        const result = await client.login({
          email: testUser.email,
          password: testUser.password,
        });

        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
        expect(result.user.email).toBe(testUser.email);

        // Update tokens
        accessToken = result.accessToken;
        refreshToken = result.refreshToken;
      });

      it('should throw AuthError for invalid credentials', async () => {
        await expect(
          client.login({
            email: testUser.email,
            password: 'WrongPassword123!',
          }),
        ).rejects.toThrow(AuthError);
      });

      it('should throw AuthError for non-existent user', async () => {
        await expect(
          client.login({
            email: 'nonexistent@example.com',
            password: 'Password123!',
          }),
        ).rejects.toThrow(AuthError);
      });
    });

    describe('getMe', () => {
      it('should return current user profile', async () => {
        // Ensure we have a valid token by logging in first
        if (!accessToken) {
          const loginResult = await client.login({
            email: testUser.email,
            password: testUser.password,
          });
          accessToken = loginResult.accessToken;
          refreshToken = loginResult.refreshToken;
        }

        const user = await client.getMe();

        expect(user.email).toBe(testUser.email);
        expect(user.name).toBe(testUser.name);
        expect(user.nickname).toBe(testUser.nickname);
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('generation');
        expect(user).toHaveProperty('sessions');
        expect(Array.isArray(user.sessions)).toBe(true);
      });

      it('should throw AuthError when not authenticated', async () => {
        const unauthenticatedClient = new ApiClient({
          baseUrl: API_BASE_URL,
          getAccessToken: () => null,
        });

        await expect(unauthenticatedClient.getMe()).rejects.toThrow(AuthError);
      });
    });

    describe('refreshToken', () => {
      it('should successfully refresh tokens', async () => {
        // Ensure we have a valid refresh token
        if (!refreshToken) {
          const loginResult = await client.login({
            email: testUser.email,
            password: testUser.password,
          });
          accessToken = loginResult.accessToken;
          refreshToken = loginResult.refreshToken;
        }

        const result = await client.refreshToken(refreshToken);

        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
        expect(result).toHaveProperty('expiresIn');

        // Update tokens
        accessToken = result.accessToken;
        refreshToken = result.refreshToken;
      });

      it('should throw AuthError for invalid refresh token', async () => {
        await expect(
          client.refreshToken('invalid-refresh-token'),
        ).rejects.toThrow(AuthError);
      });
    });
  });

  describe('Generations', () => {
    it('should list all generations', async () => {
      const generations = await client.getGenerations();

      expect(Array.isArray(generations)).toBe(true);
      expect(generations.length).toBeGreaterThan(0);

      const generation = generations[0];
      expect(generation).toHaveProperty('id');
      expect(generation).toHaveProperty('order');
    });
  });

  describe('Sessions', () => {
    it('should list all sessions', async () => {
      const sessions = await client.getSessions();

      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);

      const session = sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('name');
    });
  });

  describe('Users', () => {
    it('should list all users', async () => {
      const users = await client.getUsers();

      expect(Array.isArray(users)).toBe(true);

      if (users.length > 0) {
        const user = users[0];
        // Note: getUsers returns BasicUser which only has id, name, image
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
      }
    });
  });

  describe('Performances', () => {
    it('should list all performances', async () => {
      const performances = await client.getPerformances();

      expect(Array.isArray(performances)).toBe(true);

      if (performances.length > 0) {
        const performance = performances[0];
        expect(performance).toHaveProperty('id');
        expect(performance).toHaveProperty('name');
      }
    });

    it('should get performance by id if exists', async () => {
      const performances = await client.getPerformances();

      if (performances.length > 0) {
        const detail = await client.getPerformanceById(performances[0].id);

        expect(detail).toHaveProperty('id');
        expect(detail).toHaveProperty('name');
        expect(detail).toHaveProperty('teams');
        expect(Array.isArray(detail.teams)).toBe(true);
      }
    });

    it('should throw NotFoundError for non-existent performance', async () => {
      await expect(client.getPerformanceById(99999)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('Teams', () => {
    it('should get team by id if exists', async () => {
      const performances = await client.getPerformances();

      if (performances.length > 0) {
        const detail = await client.getPerformanceById(performances[0].id);

        if (detail.teams.length > 0) {
          const team = await client.getTeamById(detail.teams[0].id);

          expect(team).toHaveProperty('id');
          expect(team).toHaveProperty('name');
          expect(team).toHaveProperty('songName');
          expect(team).toHaveProperty('songArtist');
          expect(team).toHaveProperty('leader');
          expect(team).toHaveProperty('teamSessions');
        }
      }
    });

    it('should throw NotFoundError for non-existent team', async () => {
      await expect(client.getTeamById(99999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Equipments', () => {
    it('should list all equipments', async () => {
      const equipments = await client.getEquipments();

      expect(Array.isArray(equipments)).toBe(true);

      if (equipments.length > 0) {
        const equipment = equipments[0];
        expect(equipment).toHaveProperty('id');
        expect(equipment).toHaveProperty('brand');
        expect(equipment).toHaveProperty('model');
        expect(equipment).toHaveProperty('category');
      }
    });

    // Note: Equipment type filter ('room' | 'item') is not yet implemented in the API
    // The API uses 'category' query parameter instead
    it.skip('should filter equipments by type', async () => {
      const roomEquipments = await client.getEquipments('room');
      const itemEquipments = await client.getEquipments('item');

      expect(Array.isArray(roomEquipments)).toBe(true);
      expect(Array.isArray(itemEquipments)).toBe(true);
    });
  });

  describe('Rentals', () => {
    it('should list all rentals', async () => {
      const rentals = await client.getRentals();

      expect(Array.isArray(rentals)).toBe(true);

      if (rentals.length > 0) {
        const rental = rentals[0];
        expect(rental).toHaveProperty('id');
        expect(rental).toHaveProperty('title');
        expect(rental).toHaveProperty('equipment');
        expect(rental).toHaveProperty('users');
      }
    });
  });

  describe('Error Handling', () => {
    it('should include proper error details in ApiError', async () => {
      try {
        await client.getPerformanceById(99999);
        fail('Expected NotFoundError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(404);
          expect(error.detail).toHaveProperty('type');
          expect(error.detail).toHaveProperty('title');
          expect(error.detail).toHaveProperty('status');
          expect(error.detail).toHaveProperty('detail');
        }
      }
    });
  });

  describe('Response Type Contracts', () => {
    it('AuthResponse should have required fields', async () => {
      const result = await client.login({
        email: testUser.email,
        password: testUser.password,
      });

      // Verify AuthResponse contract
      const requiredAuthFields = [
        'accessToken',
        'refreshToken',
        'expiresIn',
        'user',
      ] as const;
      requiredAuthFields.forEach((field) => {
        expect(result).toHaveProperty(field);
      });

      // Verify user in AuthResponse
      const requiredUserFields = [
        'id',
        'email',
        'name',
        'nickname',
        'isAdmin',
      ] as const;
      requiredUserFields.forEach((field) => {
        expect(result.user).toHaveProperty(field);
      });

      accessToken = result.accessToken;
    });

    it('FullUser should have required fields', async () => {
      const user = await client.getMe();

      // Verify FullUser contract
      const requiredFields: (keyof FullUser)[] = [
        'id',
        'email',
        'name',
        'nickname',
        'isAdmin',
        'generation',
        'sessions',
      ];
      requiredFields.forEach((field) => {
        expect(user).toHaveProperty(field);
      });

      // Verify nested objects
      expect(user.generation).toHaveProperty('id');
      expect(user.generation).toHaveProperty('order');
      expect(Array.isArray(user.sessions)).toBe(true);
    });
  });
});
