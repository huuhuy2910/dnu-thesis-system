import { fetchData } from "../api/fetchData";
import type { ApiResponse } from "../types/api";
import type {
  DefenseTermOption,
  WorkflowAuditFilter,
  WorkflowAuditItem,
  WorkflowDecisionRequest,
  WorkflowDetailResponse,
  WorkflowMutationResponse,
  WorkflowResubmitRequest,
  WorkflowRollbackResponse,
  WorkflowTimelineResponse,
} from "../types/workflow-topic";

const WORKFLOW_BASE = "/workflows/topics";

function ensureWorkflowSuccess<T>(
  envelope: ApiResponse<T>,
  fallbackMessage: string,
): { data: T; totalCount: number } {
  if (
    !envelope.success ||
    envelope.data === null ||
    envelope.data === undefined
  ) {
    throw new Error(envelope.message || envelope.title || fallbackMessage);
  }

  return {
    data: envelope.data,
    totalCount: Number(envelope.totalCount || 0),
  };
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDefenseTermOption(item: unknown): DefenseTermOption | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const defenseTermId = toNumberOrNull(
    record.defenseTermId ?? record.defenseTermID ?? record.id,
  );

  if (defenseTermId === null || defenseTermId <= 0) {
    return null;
  }

  const defenseTermCode =
    toStringOrEmpty(record.defenseTermCode ?? record.code) ||
    `TERM-${defenseTermId}`;
  const defenseTermName =
    toStringOrEmpty(record.defenseTermName ?? record.name ?? record.termName) ||
    `Dot ${defenseTermId}`;
  const status = toStringOrEmpty(record.status) || undefined;

  return {
    defenseTermId,
    defenseTermCode,
    defenseTermName,
    status,
  };
}

export async function getDefenseTermList(): Promise<DefenseTermOption[]> {
  const envelope = await fetchData<ApiResponse<unknown>>(
    "/DefenseTerms/get-list",
    {
      method: "GET",
    },
  );

  const { data } = ensureWorkflowSuccess(
    envelope,
    "Khong the tai danh sach dot bao ve.",
  );

  const list = Array.isArray(data)
    ? data
    : typeof data === "object" &&
        data !== null &&
        Array.isArray((data as { items?: unknown[] }).items)
      ? (data as { items: unknown[] }).items
      : [];

  const normalized = list
    .map(normalizeDefenseTermOption)
    .filter((item): item is DefenseTermOption => item !== null);

  return normalized;
}

export async function getTopicWorkflowDetail(
  topicId: number,
): Promise<WorkflowDetailResponse> {
  const envelope = await fetchData<ApiResponse<WorkflowDetailResponse>>(
    `${WORKFLOW_BASE}/detail/${topicId}`,
    { method: "GET" },
  );

  return ensureWorkflowSuccess(
    envelope,
    "Khong the tai chi tiet workflow de tai.",
  ).data;
}

export async function getTopicWorkflowTimeline(
  topicId: number,
): Promise<WorkflowTimelineResponse> {
  const envelope = await fetchData<ApiResponse<WorkflowTimelineResponse>>(
    `${WORKFLOW_BASE}/timeline/${topicId}`,
    { method: "GET" },
  );

  return ensureWorkflowSuccess(
    envelope,
    "Khong the tai timeline workflow theo topicID.",
  ).data;
}

export async function getTopicWorkflowTimelineByCode(
  topicCode: string,
): Promise<WorkflowTimelineResponse> {
  const envelope = await fetchData<ApiResponse<WorkflowTimelineResponse>>(
    `${WORKFLOW_BASE}/timeline-by-code/${encodeURIComponent(topicCode)}`,
    { method: "GET" },
  );

  return ensureWorkflowSuccess(
    envelope,
    "Khong the tai timeline workflow theo topicCode.",
  ).data;
}

export async function submitTopicWorkflow(
  payload: WorkflowResubmitRequest,
): Promise<WorkflowMutationResponse> {
  const envelope = await fetchData<ApiResponse<WorkflowMutationResponse>>(
    `${WORKFLOW_BASE}/submit`,
    {
      method: "POST",
      body: payload,
    },
  );

  return ensureWorkflowSuccess(envelope, "Khong the gui de tai lan dau.").data;
}

export async function resubmitTopicWorkflow(
  payload: WorkflowResubmitRequest,
): Promise<WorkflowMutationResponse> {
  const envelope = await fetchData<ApiResponse<WorkflowMutationResponse>>(
    `${WORKFLOW_BASE}/resubmit`,
    {
      method: "POST",
      body: payload,
    },
  );

  return ensureWorkflowSuccess(envelope, "Khong the gui de tai theo workflow.")
    .data;
}

export async function decideTopicWorkflow(
  topicId: number,
  payload: WorkflowDecisionRequest,
): Promise<WorkflowMutationResponse> {
  if (
    (payload.action === "reject" || payload.action === "revision") &&
    !payload.comment.trim()
  ) {
    throw new Error("Reject/Revision bat buoc phai co comment.");
  }

  const envelope = await fetchData<ApiResponse<WorkflowMutationResponse>>(
    `${WORKFLOW_BASE}/decision/${topicId}`,
    {
      method: "POST",
      body: payload,
    },
  );

  return ensureWorkflowSuccess(
    envelope,
    "Khong the gui quyet dinh duyet de tai.",
  ).data;
}

export async function rollbackTopicWorkflowMyTestData(
  topicCode?: string,
): Promise<WorkflowRollbackResponse> {
  const query = topicCode ? `?topicCode=${encodeURIComponent(topicCode)}` : "";
  const envelope = await fetchData<ApiResponse<WorkflowRollbackResponse>>(
    `${WORKFLOW_BASE}/rollback-my-test-data${query}`,
    { method: "DELETE" },
  );

  return ensureWorkflowSuccess(
    envelope,
    "Khong the rollback du lieu test workflow.",
  ).data;
}

export async function getTopicWorkflowAudits(
  filter: WorkflowAuditFilter,
): Promise<{ items: WorkflowAuditItem[]; totalCount: number }> {
  const params = new URLSearchParams();

  Object.entries(filter).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    params.append(key, String(value));
  });

  const query = params.toString();
  const envelope = await fetchData<ApiResponse<WorkflowAuditItem[]>>(
    `${WORKFLOW_BASE}/audits${query ? `?${query}` : ""}`,
    { method: "GET" },
  );

  const { data, totalCount } = ensureWorkflowSuccess(
    envelope,
    "Khong the tai lich su workflow audit.",
  );

  return {
    items: Array.isArray(data) ? data : [],
    totalCount,
  };
}
