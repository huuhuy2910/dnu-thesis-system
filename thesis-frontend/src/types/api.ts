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
}
