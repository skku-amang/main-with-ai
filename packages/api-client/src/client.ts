import type {
  AuthResponse,
  CreateUser,
  LoginUser,
  UpdateUser,
  PublicUser,
  FullUser,
  Performance,
  PerformanceDetail,
  CreatePerformance,
  UpdatePerformance,
  TeamDetail,
  CreateTeam,
  UpdateTeam,
  TeamApplication,
  Session,
  UpdateSession,
  Generation,
  CreateGeneration,
  UpdateGeneration,
  Equipment,
  CreateEquipment,
  UpdateEquipment,
  RentalWithDetails,
  CreateRental,
  UpdateRental,
  GetRentals,
} from '@repo/shared-types';
import type { ApiResult } from './api-result';
import {
  ApiError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  type ApiErrorDetail,
} from './errors';

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void;
  onAuthError?: () => void;
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken: () => string | null;
  private onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void;
  private onAuthError?: () => void;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.getAccessToken = options.getAccessToken || (() => null);
    this.onTokenRefresh = options.onTokenRefresh;
    this.onAuthError = options.onAuthError;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const accessToken = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json = (await response.json()) as ApiResult<T>;

    if (!json.isSuccess) {
      const errorDetail = json.error;
      throw this.createError(response.status, errorDetail);
    }

    return json.data;
  }

  private createError(status: number, detail: ApiErrorDetail): ApiError {
    switch (status) {
      case 400:
        return new ValidationError(detail);
      case 401:
        this.onAuthError?.();
        return new AuthError(detail);
      case 403:
        return new ForbiddenError(detail);
      case 404:
        return new NotFoundError(detail);
      case 409:
        return new ConflictError(detail);
      default:
        return new ApiError(status, detail);
    }
  }

  // ============================================
  // Auth
  // ============================================

  async signup(data: CreateUser): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginUser): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    this.onTokenRefresh?.({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return result;
  }

  // ============================================
  // Users
  // ============================================

  async getUsers(): Promise<PublicUser[]> {
    return this.request<PublicUser[]>('/users');
  }

  async getUserById(id: number): Promise<FullUser> {
    return this.request<FullUser>(`/users/${id}`);
  }

  async getMe(): Promise<FullUser> {
    return this.request<FullUser>('/users/me');
  }

  async updateUser(id: number, data: UpdateUser): Promise<FullUser> {
    return this.request<FullUser>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Performances
  // ============================================

  async getPerformances(): Promise<Performance[]> {
    return this.request<Performance[]>('/performances');
  }

  async getPerformanceById(id: number): Promise<PerformanceDetail> {
    return this.request<PerformanceDetail>(`/performances/${id}`);
  }

  async createPerformance(data: CreatePerformance): Promise<Performance> {
    return this.request<Performance>('/performances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePerformance(id: number, data: UpdatePerformance): Promise<Performance> {
    return this.request<Performance>(`/performances/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePerformance(id: number): Promise<void> {
    return this.request<void>(`/performances/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Teams
  // ============================================

  async getTeamsByPerformance(performanceId: number): Promise<TeamDetail[]> {
    return this.request<TeamDetail[]>(`/performances/${performanceId}/teams`);
  }

  async getTeamById(id: number): Promise<TeamDetail> {
    return this.request<TeamDetail>(`/teams/${id}`);
  }

  async createTeam(data: CreateTeam): Promise<TeamDetail> {
    return this.request<TeamDetail>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeam(id: number, data: UpdateTeam): Promise<TeamDetail> {
    return this.request<TeamDetail>(`/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTeam(id: number): Promise<void> {
    return this.request<void>(`/teams/${id}`, {
      method: 'DELETE',
    });
  }

  async applyToTeam(teamId: number, applications: TeamApplication): Promise<TeamDetail> {
    return this.request<TeamDetail>(`/teams/${teamId}/apply`, {
      method: 'PATCH',
      body: JSON.stringify(applications),
    });
  }

  async unapplyFromTeam(teamId: number, applications: TeamApplication): Promise<TeamDetail> {
    return this.request<TeamDetail>(`/teams/${teamId}/unapply`, {
      method: 'PATCH',
      body: JSON.stringify(applications),
    });
  }

  // ============================================
  // Sessions
  // ============================================

  async getSessions(): Promise<Session[]> {
    return this.request<Session[]>('/sessions');
  }

  async updateSession(id: number, data: UpdateSession): Promise<Session> {
    return this.request<Session>(`/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Generations
  // ============================================

  async getGenerations(): Promise<Generation[]> {
    return this.request<Generation[]>('/generations');
  }

  async createGeneration(data: CreateGeneration): Promise<Generation> {
    return this.request<Generation>('/generations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGeneration(id: number, data: UpdateGeneration): Promise<Generation> {
    return this.request<Generation>(`/generations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGeneration(id: number): Promise<void> {
    return this.request<void>(`/generations/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Equipments
  // ============================================

  async getEquipments(type?: 'room' | 'item'): Promise<Equipment[]> {
    const params = type ? `?type=${type}` : '';
    return this.request<Equipment[]>(`/equipments${params}`);
  }

  async getEquipmentById(id: number): Promise<Equipment> {
    return this.request<Equipment>(`/equipments/${id}`);
  }

  async createEquipment(data: CreateEquipment): Promise<Equipment> {
    return this.request<Equipment>('/equipments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEquipment(id: number, data: UpdateEquipment): Promise<Equipment> {
    return this.request<Equipment>(`/equipments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEquipment(id: number): Promise<void> {
    return this.request<void>(`/equipments/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Rentals
  // ============================================

  async getRentals(params?: GetRentals): Promise<RentalWithDetails[]> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.equipmentId) searchParams.set('equipmentId', String(params.equipmentId));
    if (params?.from) searchParams.set('from', params.from.toISOString());
    if (params?.to) searchParams.set('to', params.to.toISOString());

    const query = searchParams.toString();
    return this.request<RentalWithDetails[]>(`/rentals${query ? `?${query}` : ''}`);
  }

  async getRentalById(id: number): Promise<RentalWithDetails> {
    return this.request<RentalWithDetails>(`/rentals/${id}`);
  }

  async createRental(data: CreateRental): Promise<RentalWithDetails> {
    return this.request<RentalWithDetails>('/rentals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRental(id: number, data: UpdateRental): Promise<RentalWithDetails> {
    return this.request<RentalWithDetails>(`/rentals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRental(id: number): Promise<void> {
    return this.request<void>(`/rentals/${id}`, {
      method: 'DELETE',
    });
  }
}
