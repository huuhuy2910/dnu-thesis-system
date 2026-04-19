import { fetchData } from "../api/fetchData";
import { getAccessToken } from "./auth-session.service";
import type { ApiResponse } from "../types/api";
import type { LecturerProfile } from "../types/lecturer-profile";
import type { StudentProfile } from "../types/studentProfile";
import type {
  TopicRenameRequestCreateDto,
  TopicRenameRequestDetailDto,
  TopicRenameRequestFileReadDto,
  TopicRenameRequestHistoryItem,
  TopicRenameRequestListFilter,
  TopicRenameRequestListItem,
  TopicRenameRequestReviewDto,
  TopicRenameRequestUpdateDto,
} from "../types/topic-rename-request";

const WORKFLOW_BASE = "/workflows/topic-rename-requests";

const envBaseRaw = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5180"
).toString();

const ensureScheme = (value: string) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `http://${value}`;
};

const envBase = ensureScheme(envBaseRaw.trim());
const normalizedBase = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
const apiBase = `${normalizedBase}/api`;

function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${normalizedPath}`;
}

function appendQuery(
  params: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === "boolean") {
    params.append(key, value ? "true" : "false");
    return;
  }

  const text = String(value).trim();
  if (!text) {
    return;
  }

  params.append(key, text);
}

export function buildQueryString(input: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) =>
    appendQuery(params, key, value),
  );
  const query = params.toString();
  return query ? `?${query}` : "";
}

function toPascalCaseKey(key: string): string {
  const text = String(key ?? "").trim();
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildPascalCaseQueryString(input: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) =>
    appendQuery(params, toPascalCaseKey(key), value),
  );
  const query = params.toString();
  return query ? `?${query}` : "";
}

function toString(value: unknown): string {
  return String(value ?? "").trim();
}

function tryParseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
}

function normalizeListPayload(payload: unknown): {
  items: Record<string, unknown>[];
  totalCount: number;
} {
  if (Array.isArray(payload)) {
    return {
      items: payload as Record<string, unknown>[],
      totalCount: payload.length,
    };
  }

  if (!payload || typeof payload !== "object") {
    return { items: [], totalCount: 0 };
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.items,
    record.Items,
    record.data,
    record.Data,
    record.list,
    record.List,
    record.records,
    record.Records,
    record.result,
    record.Result,
  ];

  const items = candidates.find((candidate) => Array.isArray(candidate));
  if (!Array.isArray(items)) {
    return { items: [], totalCount: 0 };
  }

  return {
    items: items as Record<string, unknown>[],
    totalCount: Number(
      record.totalCount ??
        record.TotalCount ??
        record.total ??
        record.Total ??
        items.length,
    ),
  };
}

function normalizeListItem(
  item: Record<string, unknown>,
): TopicRenameRequestListItem {
  const parsedId =
    tryParseNumber(item.topicRenameRequestID) ??
    tryParseNumber(item.topicRenameRequestId) ??
    tryParseNumber(item.TopicRenameRequestID) ??
    tryParseNumber(item.TopicRenameRequestId) ??
    tryParseNumber(item.requestID) ??
    tryParseNumber(item.requestId) ??
    tryParseNumber(item.RequestID) ??
    tryParseNumber(item.RequestId) ??
    tryParseNumber(item.id) ??
    tryParseNumber(item.Id);

  return {
    topicRenameRequestID: parsedId ?? 0,
    requestCode: toString(
      item.requestCode ?? item.RequestCode ?? item.code ?? item.Code,
    ),
    topicID: toNullableNumber(
      item.topicID ?? item.TopicID ?? item.topicId ?? item.TopicId,
    ),
    topicCode: toString(
      item.topicCode ?? item.TopicCode ?? item.topic_code ?? item.TopicCode,
    ),
    oldTitle: toString(item.oldTitle ?? item.OldTitle),
    newTitle: toString(item.newTitle ?? item.NewTitle),
    reason: toString(item.reason ?? item.Reason),
    status: toString(item.status ?? item.Status),
    requestedByUserCode: toString(
      item.requestedByUserCode ?? item.RequestedByUserCode,
    ),
    requestedByName: toString(item.requestedByName ?? item.RequestedByName),
    requestedByStudentCode: toString(
      item.requestedByStudentCode ?? item.RequestedByStudentCode,
    ),
    reviewedByUserCode: toString(
      item.reviewedByUserCode ?? item.ReviewedByUserCode,
    ),
    reviewedByName: toString(item.reviewedByName ?? item.ReviewedByName),
    reviewedByLecturerCode: toString(
      item.reviewedByLecturerCode ?? item.ReviewedByLecturerCode,
    ),
    requestedByRole: toString(item.requestedByRole ?? item.RequestedByRole),
    reviewedByRole: toString(item.reviewedByRole ?? item.ReviewedByRole),
    createdAt: toString(item.createdAt ?? item.CreatedAt),
    reviewedAt: toString(item.reviewedAt ?? item.ReviewedAt),
    appliedAt: toString(item.appliedAt ?? item.AppliedAt),
    raw: item,
  };
}

function normalizeHistoryItem(
  item: Record<string, unknown>,
): TopicRenameRequestHistoryItem {
  return {
    historyId:
      tryParseNumber(item.historyId) ??
      tryParseNumber(item.historyID) ??
      tryParseNumber(item.HistoryId) ??
      tryParseNumber(item.HistoryID) ??
      0,
    historyCode: toString(item.historyCode ?? item.HistoryCode),
    topicID: toNullableNumber(
      item.topicID ?? item.TopicID ?? item.topicId ?? item.TopicId,
    ),
    topicCode: toString(item.topicCode ?? item.TopicCode),
    requestId: toNullableNumber(
      item.requestId ?? item.requestID ?? item.RequestId ?? item.RequestID,
    ),
    requestCode: toString(item.requestCode ?? item.RequestCode),
    previousTitle: toString(
      item.previousTitle ?? item.oldTitle ?? item.OldTitle,
    ),
    effectiveAt: toString(item.effectiveAt ?? item.EffectiveAt),
    newTitle: toString(item.newTitle ?? item.NewTitle),
    changeType: toString(item.changeType ?? item.ChangeType),
    changeReason: toString(
      item.changeReason ?? item.reason ?? item.Reason ?? item.note ?? item.Note,
    ),
    approvalComment: toString(item.approvalComment ?? item.ApprovalComment),
    changedByUserCode: toString(
      item.changedByUserCode ??
        item.ChangedByUserCode ??
        item.performedBy ??
        item.PerformedBy,
    ),
    changedByRole: toString(item.changedByRole ?? item.ChangedByRole),
    approvedByUserCode: toString(
      item.approvedByUserCode ??
        item.ApprovedByUserCode ??
        item.approvedBy ??
        item.ApprovedBy,
    ),
    approvedByRole: toString(item.approvedByRole ?? item.ApprovedByRole),
    createdAt: toString(item.createdAt ?? item.CreatedAt),
    lastUpdated: toString(item.lastUpdated ?? item.LastUpdated),
    raw: item,
  };
}

function normalizeProfileListPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.data,
    record.Data,
    record.items,
    record.Items,
    record.result,
    record.Result,
  ];

  const items = candidates.find((candidate) => Array.isArray(candidate));
  return Array.isArray(items) ? (items as T[]) : [];
}

async function requestApiData<T>(
  path: string,
  options?: Parameters<typeof fetchData>[1],
  fallback = "Không thể tải dữ liệu.",
): Promise<{ data: T; totalCount: number }> {
  const response = await fetchData<ApiResponse<T>>(path, options);
  if (!response?.success) {
    throw new Error(response?.message || response?.title || fallback);
  }

  return {
    data: response.data as T,
    totalCount: Number(response.totalCount || response.TotalCount || 0),
  };
}

function normalizeCreateResponse(
  responseData: Record<string, unknown> | null,
  payload: TopicRenameRequestCreateDto,
): Record<string, unknown> {
  const data = responseData ?? {};

  return {
    ...data,
    reviewedByUserCode:
      toString(data.reviewedByUserCode ?? data.ReviewedByUserCode) ||
      payload.reviewedByUserCode ||
      null,
    reviewedByRole:
      toString(data.reviewedByRole ?? data.ReviewedByRole) ||
      payload.reviewedByRole ||
      null,
    supervisorUserCode:
      toString(data.supervisorUserCode ?? data.SupervisorUserCode) ||
      payload.supervisorUserCode ||
      null,
    supervisorLecturerCode:
      toString(data.supervisorLecturerCode ?? data.SupervisorLecturerCode) ||
      payload.supervisorLecturerCode ||
      null,
    requestedByUserCode:
      toString(data.requestedByUserCode ?? data.RequestedByUserCode) ||
      payload.requestedByUserCode ||
      null,
    requestedByRole:
      toString(data.requestedByRole ?? data.RequestedByRole) ||
      payload.requestedByRole ||
      null,
  };
}

export async function listTopicRenameRequests(
  filter: TopicRenameRequestListFilter = {},
): Promise<{ items: TopicRenameRequestListItem[]; totalCount: number }> {
  const query = buildPascalCaseQueryString(filter);
  const response = await requestApiData<unknown>(
    `${WORKFLOW_BASE}/get-list${query}`,
    { method: "GET" },
    "Không thể tải danh sách đơn xin đổi đề tài.",
  );
  const normalized = normalizeListPayload(response.data);
  const items = normalized.items
    .map(normalizeListItem)
    .filter((item) => item.topicRenameRequestID > 0);

  return {
    items,
    totalCount:
      response.totalCount > 0 ? response.totalCount : normalized.totalCount,
  };
}

export async function getTopicRenameRequestDetail(id: number | string) {
  return requestApiData<TopicRenameRequestDetailDto>(
    `${WORKFLOW_BASE}/get-detail/${encodeURIComponent(String(id))}`,
    { method: "GET" },
    "Không thể tải chi tiết đơn xin đổi đề tài.",
  );
}

export async function getTopicRenameRequestCreateTemplate() {
  return requestApiData<TopicRenameRequestCreateDto>(
    `${WORKFLOW_BASE}/get-create`,
    { method: "GET" },
    "Không thể tải dữ liệu tạo mới đơn xin đổi đề tài.",
  );
}

export async function getLecturerProfileByUserCode(
  userCode: string,
): Promise<LecturerProfile | null> {
  const normalizedUserCode = String(userCode ?? "").trim();
  if (!normalizedUserCode) {
    return null;
  }

  const response = await fetchData<unknown>(
    `/LecturerProfiles/get-list?UserCode=${encodeURIComponent(normalizedUserCode)}&Page=0&PageSize=10`,
    { method: "GET" },
  );
  const items = normalizeProfileListPayload<LecturerProfile>(response);
  return items[0] ?? null;
}

export async function getStudentProfileByUserCode(
  userCode: string,
): Promise<StudentProfile | null> {
  const normalizedUserCode = String(userCode ?? "").trim();
  if (!normalizedUserCode) {
    return null;
  }

  const response = await fetchData<unknown>(
    `/StudentProfiles/get-list?UserCode=${encodeURIComponent(normalizedUserCode)}&Page=0&PageSize=10`,
    { method: "GET" },
  );
  const items = normalizeProfileListPayload<StudentProfile>(response);
  return items[0] ?? null;
}

export async function createTopicRenameRequest(
  payload: TopicRenameRequestCreateDto,
) {
  const response = await requestApiData<Record<string, unknown>>(
    `${WORKFLOW_BASE}/create`,
    { method: "POST", body: payload },
    "Không thể tạo đơn xin đổi đề tài.",
  );

  return {
    ...response,
    data: normalizeCreateResponse(response.data ?? null, payload),
  };
}

export async function getTopicRenameRequestUpdateTemplate(id: number | string) {
  return requestApiData<TopicRenameRequestUpdateDto>(
    `${WORKFLOW_BASE}/get-update/${encodeURIComponent(String(id))}`,
    { method: "GET" },
    "Không thể tải dữ liệu sửa đơn xin đổi đề tài.",
  );
}

export async function updateTopicRenameRequest(
  id: number | string,
  payload: TopicRenameRequestUpdateDto,
) {
  return requestApiData<Record<string, unknown>>(
    `${WORKFLOW_BASE}/update/${encodeURIComponent(String(id))}`,
    { method: "PUT", body: payload },
    "Không thể cập nhật đơn xin đổi đề tài.",
  );
}

export async function deleteTopicRenameRequest(id: number | string) {
  return requestApiData<Record<string, unknown>>(
    `${WORKFLOW_BASE}/delete/${encodeURIComponent(String(id))}`,
    { method: "DELETE" },
    "Không thể xóa đơn xin đổi đề tài.",
  );
}

export async function deleteTopicRenameRequestTemplate(
  requestId: number | string,
) {
  return requestApiData<Record<string, unknown>>(
    `${WORKFLOW_BASE}/${encodeURIComponent(String(requestId))}/delete-template`,
    { method: "DELETE" },
    "Không thể xóa file template.",
  );
}

export async function reviewTopicRenameRequest(
  id: number | string,
  payload: TopicRenameRequestReviewDto,
) {
  return requestApiData<Record<string, unknown>>(
    `${WORKFLOW_BASE}/${encodeURIComponent(String(id))}/review`,
    { method: "POST", body: payload },
    "Không thể duyệt đơn xin đổi đề tài.",
  );
}

export async function generateTopicRenameRequestTemplate(
  id: number | string,
  placeOfBirth?: string,
) {
  const query = buildQueryString({ placeOfBirth: placeOfBirth || undefined });
  return requestApiData<TopicRenameRequestFileReadDto>(
    `${WORKFLOW_BASE}/${encodeURIComponent(String(id))}/generate-template${query}`,
    { method: "POST" },
    "Không thể sinh file Word mẫu.",
  );
}

export function buildTopicRenameRequestDownloadUrl(
  id: number | string,
): string {
  return resolveApiUrl(
    `${WORKFLOW_BASE}/${encodeURIComponent(String(id))}/download-template`,
  );
}

function tryExtractFilenameFromContentDisposition(
  contentDisposition: string | null,
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1]?.trim() || null;
}

export async function downloadTopicRenameRequestTemplate(
  id: number | string,
): Promise<{ blob: Blob; fileName: string | null }> {
  const url = buildTopicRenameRequestDownloadUrl(id);
  const token = getAccessToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let message = "Không thể tải file Word mẫu.";
    const contentType = response.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const errorPayload = (await response.json()) as Record<string, unknown>;
        message =
          String(
            errorPayload.message ||
              errorPayload.Message ||
              errorPayload.title ||
              errorPayload.Title ||
              message,
          ).trim() || message;
      }
    } catch {
      // keep fallback message
    }

    throw new Error(message);
  }

  const fileName = tryExtractFilenameFromContentDisposition(
    response.headers.get("content-disposition"),
  );
  const blob = await response.blob();
  return { blob, fileName };
}

export function parseTopicRenameRequestTemplateFiles(
  data: unknown,
): TopicRenameRequestFileReadDto[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => {
    if (!item || typeof item !== "object") {
      return {} as TopicRenameRequestFileReadDto;
    }

    const record = item as Record<string, unknown>;
    return {
      fileUrl: toString(record.fileUrl ?? record.fileURL),
      fileName: toString(record.fileName ?? record.FileName),
      fileType: toString(record.fileType ?? record.FileType),
      storageProvider: toString(
        record.storageProvider ?? record.StorageProvider,
      ),
      isCurrent: toBoolean(record.isCurrent ?? record.IsCurrent),
      ...record,
    };
  });
}

export function parseTopicRenameRequestHistory(
  data: unknown,
): TopicRenameRequestHistoryItem[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => {
    if (!item || typeof item !== "object") {
      return {
        historyId: 0,
        historyCode: "",
        topicID: null,
        topicCode: "",
        requestId: null,
        requestCode: "",
        previousTitle: "",
        effectiveAt: "",
        newTitle: "",
        changeType: "",
        changeReason: "",
        approvalComment: "",
        changedByUserCode: "",
        changedByRole: "",
        approvedByUserCode: "",
        approvedByRole: "",
        createdAt: "",
        lastUpdated: "",
        raw: {},
      };
    }

    return normalizeHistoryItem(item as Record<string, unknown>);
  });
}

export function parseTopicRenameDetail(
  payload: TopicRenameRequestDetailDto | null | undefined,
): TopicRenameRequestDetailDto {
  const data = payload ?? {
    request: null,
    templateData: null,
    files: [],
    history: [],
  };

  return {
    request:
      data.request && typeof data.request === "object"
        ? (data.request as Record<string, unknown>)
        : null,
    templateData:
      data.templateData && typeof data.templateData === "object"
        ? (data.templateData as Record<string, unknown>)
        : null,
    files: parseTopicRenameRequestTemplateFiles(data.files),
    history: parseTopicRenameRequestHistory(data.history),
  };
}
