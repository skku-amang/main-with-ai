export interface ApiErrorDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: ApiErrorDetail,
  ) {
    super(detail.detail);
    this.name = 'ApiError';
  }
}

export class AuthError extends ApiError {
  constructor(detail: ApiErrorDetail) {
    super(401, detail);
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(detail: ApiErrorDetail) {
    super(403, detail);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(detail: ApiErrorDetail) {
    super(404, detail);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(detail: ApiErrorDetail) {
    super(409, detail);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends ApiError {
  constructor(detail: ApiErrorDetail) {
    super(400, detail);
    this.name = 'ValidationError';
  }
}
