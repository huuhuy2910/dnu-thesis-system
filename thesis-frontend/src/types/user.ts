export type Role = 'STUDENT' | 'LECTURER' | 'ADMIN' | string;

export interface User {
  userID?: number;
  userCode?: string;
  username?: string;
  fullName?: string;
  email?: string;
  role?: Role;
  // có thể có thêm các field khác từ API
}
