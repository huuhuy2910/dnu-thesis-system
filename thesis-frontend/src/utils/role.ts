export const ROLE_STUDENT = "STUDENT";
export const ROLE_LECTURER = "LECTURER";
export const ROLE_ADMIN = "ADMIN";
export const ROLE_STUDENT_SERVICE = "STUDENTSERVICE";

const roleAliasMap: Record<string, string> = {
  STUDENT: ROLE_STUDENT,
  LECTURER: ROLE_LECTURER,
  ADMIN: ROLE_ADMIN,
  STUDENTSERVICE: ROLE_STUDENT_SERVICE,
  STUDENT_SERVICE: ROLE_STUDENT_SERVICE,
  "STUDENT SERVICE": ROLE_STUDENT_SERVICE,
};

export function normalizeRole(value: unknown): string {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!raw) return "";
  return roleAliasMap[raw] ?? raw;
}

export const RolePaths: Record<string, string> = {
  [ROLE_STUDENT]: "/student",
  [ROLE_LECTURER]: "/lecturer",
  [ROLE_ADMIN]: "/admin",
  [ROLE_STUDENT_SERVICE]: "/student-service",
};

export function isManagementRole(value: unknown): boolean {
  const role = normalizeRole(value);
  return role === ROLE_ADMIN || role === ROLE_STUDENT_SERVICE;
}
