import type { ApiErrorDetail } from './errors';

export interface ApiSuccessResult<T> {
  isSuccess: true;
  data: T;
}

export interface ApiErrorResult {
  isSuccess: false;
  error: ApiErrorDetail;
}

export type ApiResult<T> = ApiSuccessResult<T> | ApiErrorResult;
