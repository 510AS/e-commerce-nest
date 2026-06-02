export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  dir?: 'ltr' | 'rtl';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  correlationId: string;
  timestamp: string;
  path: string;
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
