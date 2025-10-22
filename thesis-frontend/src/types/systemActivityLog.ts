export interface SystemActivityLog {
  logID: number;
  entityName: string;
  entityID: string;
  actionType: string;
  actionDescription: string;
  oldValue: string | null;
  newValue: string | null;
  userID: number | null;
  userCode: string;
  userRole: string;
  ipAddress: string;
  deviceInfo: string;
  module: string;
  performedAt: string;
  status: string;
  relatedRecordCode: string | null;
  comment: string | null;
}

export interface ApiResponseSystemActivityLogs {
  success: boolean;
  code: string | number | null;
  httpStatusCode: number;
  title: string | null;
  message: string | null;
  data: SystemActivityLog[] | null;
  totalCount: number;
  isRedirect: boolean;
  redirectUrl: string | null;
  errors: Record<string, string[]> | null;
}
