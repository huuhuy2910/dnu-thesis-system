import { normalizeRole } from "./role";

export type UserManagementAction =
  | "users:list"
  | "users:detail"
  | "users:create"
  | "users:update-role"
  | "users:delete";

const permissionMap: Record<string, UserManagementAction[]> = {
  ADMIN: [
    "users:list",
    "users:detail",
    "users:create",
    "users:update-role",
    "users:delete",
  ],
  STUDENTSERVICE: ["users:list", "users:detail"],
  LECTURER: [],
  STUDENT: [],
};

export function hasUserManagementPermission(
  roleInput: unknown,
  action: UserManagementAction,
): boolean {
  const role = normalizeRole(roleInput);
  const allowedActions = permissionMap[role] || [];
  return allowedActions.includes(action);
}
