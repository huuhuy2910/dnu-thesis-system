export interface ApiWarning {
  type: string;
  code: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  code: string | number | null;
  httpStatusCode: number;
  title: string | null;
  message: string | null;
  data: T | null;
  totalCount: number;
  isRedirect: boolean;
  redirectUrl: string | null;
  errors: Record<string, string[]> | null;
  warnings?: ApiWarning[];
  traceId?: string;
  idempotencyReplay?: boolean;
  concurrencyToken?: string | null;
  allowedActions?: string[];
}
