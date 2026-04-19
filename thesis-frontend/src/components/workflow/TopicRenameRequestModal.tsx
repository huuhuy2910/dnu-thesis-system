import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FC } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { FetchDataError, normalizeUrl } from "../../api/fetchData";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/useToast";
import {
  ROLE_ADMIN,
  ROLE_LECTURER,
  ROLE_STUDENT,
  normalizeRole,
} from "../../utils/role";
import {
  createTopicRenameRequest,
  deleteTopicRenameRequest,
  deleteTopicRenameRequestTemplate,
  generateTopicRenameRequestTemplate,
  getTopicRenameRequestCreateTemplate,
  getLecturerProfileByUserCode,
  getTopicRenameRequestDetail,
  getTopicRenameRequestUpdateTemplate,
  getStudentProfileByUserCode,
  listTopicRenameRequests,
  parseTopicRenameDetail,
  reviewTopicRenameRequest,
  updateTopicRenameRequest,
} from "../../services/topic-rename-request.service";
import type { LecturerProfile } from "../../types/lecturer-profile";
import type {
  TopicRenameRequestCreateDto,
  TopicRenameRequestCreateFormData,
  TopicRenameRequestDetailDto,
  TopicRenameRequestFileReadDto,
  TopicRenameRequestListItem,
  TopicRenameRequestReviewAction,
  TopicRenameRequestReviewDto,
  TopicRenameRequestUpdateFormData,
} from "../../types/topic-rename-request";
import type { StudentProfile } from "../../types/studentProfile";

type TopicContext = {
  topicID?: number | null;
  topicCode?: string | null;
  title?: string | null;
  proposerUserCode?: string | null;
  supervisorUserCode?: string | null;
};

type PanelMode = "detail" | "create" | "edit" | "review";

type CreateTemplateContext = {
  studentProfile: StudentProfile | null;
  lecturerProfile: LecturerProfile | null;
  proposerUserCode: string | null;
  supervisorUserCode: string | null;
  reviewedByUserCode: string | null;
  reviewedByRole: string | null;
};

type ListFilterState = {
  topicID: string;
  topicCode: string;
  status: string;
  requestedByUserCode: string;
  reviewedByUserCode: string;
  oldTitle: string;
  newTitle: string;
};

interface TopicRenameRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTopic?: TopicContext | null;
  initialMode?: PanelMode;
}

const initialListFilters: ListFilterState = {
  topicID: "",
  topicCode: "",
  status: "",
  requestedByUserCode: "",
  reviewedByUserCode: "",
  oldTitle: "",
  newTitle: "",
};

const initialCreateForm: TopicRenameRequestCreateFormData = {
  topicID: "",
  topicCode: "",
  newTitle: "",
  reason: "",
};

const initialUpdateForm: TopicRenameRequestUpdateFormData = {
  newTitle: "",
  reason: "",
};

const initialCreateTemplateContext: CreateTemplateContext = {
  studentProfile: null,
  lecturerProfile: null,
  proposerUserCode: null,
  supervisorUserCode: null,
  reviewedByUserCode: null,
  reviewedByRole: null,
};

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 120,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  } satisfies CSSProperties,
  card: {
    width: "min(1320px, 100%)",
    maxHeight: "92vh",
    minHeight: 0,
    overflow: "hidden",
    background: "#fffefb",
    borderRadius: 16,
    border: "1px solid #e8d9bf",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.24)",
    display: "flex",
    flexDirection: "column",
  } satisfies CSSProperties,
  header: {
    padding: 18,
    borderBottom: "1px solid #f1e3cc",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
    background: "linear-gradient(180deg, #fff8ea 0%, #fffefb 100%)",
  } satisfies CSSProperties,
  body: {
    flex: 1,
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
  } satisfies CSSProperties,
  main: {
    padding: 18,
    overflowY: "auto",
    minHeight: 0,
    display: "grid",
    gap: 14,
  } satisfies CSSProperties,
  footer: {
    padding: 14,
    borderTop: "1px solid #e8d9bf",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    background: "#fffefb",
  } satisfies CSSProperties,
};

const cardStyles = {
  section: {
    border: "1px solid #ebeff5",
    borderRadius: 14,
    background: "#ffffff",
    boxShadow: "0 1px 6px rgba(15, 23, 42, 0.04)",
    overflow: "hidden",
  } satisfies CSSProperties,
  sectionHeader: {
    padding: 12,
    borderBottom: "1px solid #ebeff5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    background: "#f8fafc",
  } satisfies CSSProperties,
  sectionBody: {
    padding: 12,
    display: "grid",
    gap: 10,
  } satisfies CSSProperties,
};

const actionButtonBase = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 8,
  padding: "8px 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
} satisfies CSSProperties;

const actionButtonPrimary = {
  ...actionButtonBase,
  borderColor: "#f37021",
  background: "#f37021",
  color: "#ffffff",
} satisfies CSSProperties;

const actionButtonGhost = {
  ...actionButtonBase,
} satisfies CSSProperties;

const actionButtonDanger = {
  ...actionButtonBase,
  borderColor: "#fecaca",
  background: "#fff5f5",
  color: "#b91c1c",
} satisfies CSSProperties;

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "9px 12px",
  background: "#ffffff",
  outline: "none",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: "vertical",
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readField(
  record: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback = "",
): string {
  if (!record) return fallback;
  for (const key of keys) {
    const exact = record[key];
    if (exact !== undefined && exact !== null && String(exact).trim()) {
      return String(exact).trim();
    }
    const matchedKey = Object.keys(record).find(
      (candidate) => candidate.toLowerCase() === key.toLowerCase(),
    );
    if (matchedKey) {
      const value = record[matchedKey];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }
  }
  return fallback;
}

type FieldLookup = Map<string, string>;

function buildFieldLookup(
  record: Record<string, unknown> | null | undefined,
): FieldLookup {
  const lookup = new Map<string, string>();
  if (!record) return lookup;

  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;

    const text = String(value).trim();
    if (!text) continue;

    lookup.set(key.toLowerCase(), text);
    if (!lookup.has(key)) {
      lookup.set(key, text);
    }
  }

  return lookup;
}

function readFieldFromLookup(
  lookup: FieldLookup,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const exact = lookup.get(key);
    if (exact) return exact;

    const matched = lookup.get(key.toLowerCase());
    if (matched) return matched;
  }
  return fallback;
}

function normalizeStatusTone(
  status: string,
): "pending" | "approved" | "rejected" | "unknown" {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();
  if (normalized.includes("pending") || normalized.includes("chờ"))
    return "pending";
  if (
    normalized.includes("approved") ||
    normalized.includes("duyet") ||
    normalized.includes("đã duyệt")
  )
    return "approved";
  if (
    normalized.includes("rejected") ||
    normalized.includes("từ chối") ||
    normalized.includes("reject")
  )
    return "rejected";
  return "unknown";
}

function statusPalette(tone: ReturnType<typeof normalizeStatusTone>): {
  bg: string;
  text: string;
  border: string;
} {
  switch (tone) {
    case "pending":
      return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" };
    case "approved":
      return { bg: "#dcfce7", text: "#166534", border: "#22c55e" };
    case "rejected":
      return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" };
    default:
      return { bg: "#e2e8f0", text: "#475569", border: "#94a3b8" };
  }
}

function extractValidationMessages(error: unknown): Record<string, string> {
  if (!(error instanceof FetchDataError)) {
    return {};
  }

  const payload = error.data as Record<string, unknown> | null | undefined;
  const validation = payload?.errors || payload?.Errors;
  if (
    !validation ||
    typeof validation !== "object" ||
    Array.isArray(validation)
  ) {
    return {};
  }

  return Object.entries(validation as Record<string, unknown>).reduce<
    Record<string, string>
  >((accumulator, [key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      accumulator[key] = String(value[0] ?? "").trim();
    } else if (typeof value === "string" && value.trim()) {
      accumulator[key] = value.trim();
    }
    return accumulator;
  }, {});
}

function isEditableStatus(status: string): boolean {
  const tone = normalizeStatusTone(status);
  return tone === "pending" || tone === "rejected";
}

function isPendingStatus(status: string): boolean {
  return normalizeStatusTone(status) === "pending";
}

function formatDisplay(value: unknown, placeholder = "-"): string {
  const text = String(value ?? "").trim();
  return text || placeholder;
}

function isSameFileEntry(
  left: TopicRenameRequestFileReadDto | null | undefined,
  right: TopicRenameRequestFileReadDto | null | undefined,
): boolean {
  if (!left || !right) return false;

  const leftUrl = String(left.fileUrl ?? "").trim();
  const rightUrl = String(right.fileUrl ?? "").trim();
  if (leftUrl && rightUrl && leftUrl === rightUrl) {
    return true;
  }

  const leftName = String(left.fileName ?? "").trim();
  const rightName = String(right.fileName ?? "").trim();
  if (leftName && rightName && leftName === rightName) {
    return true;
  }

  return false;
}

function pickFirstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) {
      return text;
    }
  }
  return "";
}

function getRequestId(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const value =
    record.topicRenameRequestID ??
    record.topicRenameRequestId ??
    record.TopicRenameRequestID ??
    record.TopicRenameRequestId ??
    record.requestID ??
    record.requestId ??
    record.RequestID ??
    record.RequestId ??
    record.id ??
    record.Id;
  const numberValue = toNumber(value);
  return numberValue;
}

const TopicRenameRequestModal: FC<TopicRenameRequestModalProps> = ({
  isOpen,
  onClose,
  currentTopic,
  initialMode = "detail",
}) => {
  const { addToast } = useToast();
  const auth = useAuth();
  const currentRole = normalizeRole(auth.user?.role);
  const canReview = currentRole === ROLE_ADMIN || currentRole === ROLE_LECTURER;
  const isStudentRole = currentRole === ROLE_STUDENT;

  const [panelMode, setPanelMode] = useState<PanelMode>(initialMode);
  const [listFilters, setListFilters] =
    useState<ListFilterState>(initialListFilters);
  const [requests, setRequests] = useState<TopicRenameRequestListItem[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );
  const [detail, setDetail] = useState<TopicRenameRequestDetailDto | null>(
    null,
  );
  const [generatedFile, setGeneratedFile] =
    useState<TopicRenameRequestFileReadDto | null>(null);
  const [createForm, setCreateForm] =
    useState<TopicRenameRequestCreateFormData>(initialCreateForm);
  const [editForm, setEditForm] =
    useState<TopicRenameRequestUpdateFormData>(initialUpdateForm);
  const [createTemplateContext, setCreateTemplateContext] =
    useState<CreateTemplateContext>(initialCreateTemplateContext);
  const [reviewComment, setReviewComment] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingTemplateFile, setDeletingTemplateFile] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const studentProfileCacheRef = useRef(
    new Map<string, StudentProfile | null>(),
  );
  const lecturerProfileCacheRef = useRef(
    new Map<string, LecturerProfile | null>(),
  );

  const selectedRequest = useMemo(
    () =>
      requests.find(
        (item) => item.topicRenameRequestID === selectedRequestId,
      ) ?? null,
    [requests, selectedRequestId],
  );

  const selectedRequestOwnerCode = useMemo(() => {
    if (!selectedRequest) return "";
    return readField(
      selectedRequest.raw,
      [
        "requestedByUserCode",
        "RequestedByUserCode",
        "requesterCode",
        "RequesterCode",
        "createdByUserCode",
        "CreatedByUserCode",
        "createdBy",
        "CreatedBy",
      ],
      selectedRequest.requestedByUserCode,
    );
  }, [selectedRequest]);

  const selectedRequestStatus = useMemo(() => {
    if (selectedRequest) {
      return readField(
        selectedRequest.raw,
        ["status", "Status"],
        selectedRequest.status,
      );
    }
    return readField(detail?.request, ["status", "Status"], "");
  }, [detail?.request, selectedRequest]);

  const hasPendingRequest = useMemo(
    () => requests.some((item) => isPendingStatus(item.status)),
    [requests],
  );

  const activeDetail = detail?.request ?? selectedRequest?.raw ?? null;
  const currentStatus = selectedRequestStatus;
  const statusTone = normalizeStatusTone(currentStatus);
  const statusColors = statusPalette(statusTone);
  const activeRequestId =
    selectedRequestId ?? selectedRequest?.topicRenameRequestID ?? null;

  const canModifySelected =
    !!selectedRequest &&
    isStudentRole &&
    String(selectedRequestOwnerCode) === String(auth.user?.userCode ?? "");
  const canEditSelected = canModifySelected && isEditableStatus(currentStatus);
  const canDeleteSelected =
    canModifySelected && isEditableStatus(currentStatus);
  const canReviewSelected = canReview && isPendingStatus(currentStatus);
  const hasActiveRequest =
    activeRequestId !== null && activeRequestId !== undefined;

  const defaultTopicID = currentTopic?.topicID ?? null;
  const defaultTopicCode = currentTopic?.topicCode ?? "";
  const defaultTopicTitle = currentTopic?.title ?? "";
  const topicProposerUserCode =
    currentTopic?.proposerUserCode ??
    readField(
      activeDetail,
      [
        "proposerUserCode",
        "ProposerUserCode",
        "requestedByUserCode",
        "RequestedByUserCode",
      ],
      "",
    );
  const topicSupervisorUserCode =
    currentTopic?.supervisorUserCode ??
    readField(
      activeDetail,
      [
        "supervisorUserCode",
        "SupervisorUserCode",
        "reviewedByUserCode",
        "ReviewedByUserCode",
      ],
      "",
    );

  const canCreateNew = !hasPendingRequest;

  const loadTemplateContext = useCallback(
    async (
      proposerUserCode?: string | null,
      supervisorUserCode?: string | null,
    ) => {
      const normalizedProposerUserCode = String(proposerUserCode ?? "").trim();
      const normalizedSupervisorUserCode = String(
        supervisorUserCode ?? "",
      ).trim();

      if (!normalizedProposerUserCode && !normalizedSupervisorUserCode) {
        setCreateTemplateContext(initialCreateTemplateContext);
        return initialCreateTemplateContext;
      }

      const resolveStudentProfile = async (userCode: string) => {
        const normalizedUserCode = String(userCode ?? "").trim();
        if (!normalizedUserCode) return null;

        const cachedProfile =
          studentProfileCacheRef.current.get(normalizedUserCode);
        if (cachedProfile !== undefined) return cachedProfile;

        const profile = await getStudentProfileByUserCode(
          normalizedUserCode,
        ).catch(() => null);
        studentProfileCacheRef.current.set(normalizedUserCode, profile);
        return profile;
      };

      const resolveLecturerProfile = async (userCode: string) => {
        const normalizedUserCode = String(userCode ?? "").trim();
        if (!normalizedUserCode) return null;

        const cachedProfile =
          lecturerProfileCacheRef.current.get(normalizedUserCode);
        if (cachedProfile !== undefined) return cachedProfile;

        const profile = await getLecturerProfileByUserCode(
          normalizedUserCode,
        ).catch(() => null);
        lecturerProfileCacheRef.current.set(normalizedUserCode, profile);
        return profile;
      };

      const [studentProfile, lecturerProfile] = await Promise.all([
        normalizedProposerUserCode
          ? resolveStudentProfile(normalizedProposerUserCode)
          : Promise.resolve(null),
        normalizedSupervisorUserCode
          ? resolveLecturerProfile(normalizedSupervisorUserCode)
          : Promise.resolve(null),
      ]);

      const reviewedByUserCode =
        lecturerProfile?.userCode || normalizedSupervisorUserCode || null;
      const nextContext: CreateTemplateContext = {
        studentProfile,
        lecturerProfile,
        proposerUserCode:
          studentProfile?.userCode || normalizedProposerUserCode || null,
        supervisorUserCode:
          lecturerProfile?.userCode || normalizedSupervisorUserCode || null,
        reviewedByUserCode,
        reviewedByRole: reviewedByUserCode ? ROLE_LECTURER : null,
      };

      setCreateTemplateContext(nextContext);
      return nextContext;
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      setIsDeleteConfirmOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    void loadTemplateContext(topicProposerUserCode, topicSupervisorUserCode);
  }, [
    isOpen,
    loadTemplateContext,
    topicProposerUserCode,
    topicSupervisorUserCode,
  ]);

  const loadRequests = useCallback(async () => {
    setLoadingList(true);
    setBannerError(null);
    try {
      const topicIDFilter = listFilters.topicID.trim();
      const resolvedTopicID = topicIDFilter
        ? topicIDFilter
        : (defaultTopicID ?? undefined);

      const response = await listTopicRenameRequests({
        topicID: resolvedTopicID,
        topicCode:
          listFilters.topicCode.trim() || defaultTopicCode || undefined,
        status: listFilters.status.trim() || undefined,
        requestedByUserCode:
          listFilters.requestedByUserCode.trim() || undefined,
        reviewedByUserCode: listFilters.reviewedByUserCode.trim() || undefined,
        oldTitle: listFilters.oldTitle.trim() || undefined,
        newTitle: listFilters.newTitle.trim() || undefined,
        sortBy: "createdAt",
        sortDescending: true,
        page: 1,
        pageSize: 200,
      });

      setRequests(response.items);
      if (response.items.length === 0) {
        setSelectedRequestId(null);
        setDetail(null);
        return;
      }

      const nextSelected =
        (selectedRequestId &&
          response.items.find(
            (item) => item.topicRenameRequestID === selectedRequestId,
          )?.topicRenameRequestID) ||
        response.items[0].topicRenameRequestID;
      setSelectedRequestId(nextSelected);
    } catch (error) {
      if (error instanceof FetchDataError && error.status === 403) {
        setAccessDenied("Bạn không đủ quyền xem danh sách đơn xin đổi đề tài.");
      }
      setRequests([]);
      setSelectedRequestId(null);
      setDetail(null);
      setBannerError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách đơn xin đổi đề tài.",
      );
    } finally {
      setLoadingList(false);
    }
  }, [
    defaultTopicCode,
    defaultTopicID,
    listFilters.oldTitle,
    listFilters.requestedByUserCode,
    listFilters.reviewedByUserCode,

    listFilters.status,
    listFilters.topicCode,
    listFilters.topicID,
    listFilters.newTitle,
    selectedRequestId,
  ]);

  const loadDetail = useCallback(async (id: number | null) => {
    if (!id) {
      setDetail(null);
      return;
    }

    setLoadingDetail(true);
    setBannerError(null);
    try {
      const response = await getTopicRenameRequestDetail(id);
      const parsed = parseTopicRenameDetail(response.data);
      setDetail(parsed);
      setGeneratedFile(null);
    } catch (error) {
      if (error instanceof FetchDataError && error.status === 404) {
        setBannerError("Không tìm thấy đơn xin đổi đề tài");
        setDetail(null);
        return;
      }
      if (error instanceof FetchDataError && error.status === 403) {
        setAccessDenied("Bạn không đủ quyền xem chi tiết đơn xin đổi đề tài.");
      }
      setBannerError(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết đơn xin đổi đề tài.",
      );
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPanelMode(initialMode);
      setListFilters({
        ...initialListFilters,
        topicID: defaultTopicID ? String(defaultTopicID) : "",
        topicCode: defaultTopicCode,
      });
      setRequests([]);
      setSelectedRequestId(null);
      setDetail(null);
      setGeneratedFile(null);
      setCreateForm({
        topicID: defaultTopicID ? String(defaultTopicID) : "",
        topicCode: defaultTopicCode,
        newTitle: "",
        reason: "",
      });
      setCreateTemplateContext(initialCreateTemplateContext);
      setEditForm(initialUpdateForm);
      setReviewComment("");
      setPlaceOfBirth("");
      setBannerError(null);
      setFieldErrors({});
      setAccessDenied(null);
      return;
    }

    setPanelMode(initialMode);
    setListFilters({
      ...initialListFilters,
      topicID: defaultTopicID ? String(defaultTopicID) : "",
      topicCode: defaultTopicCode,
    });
    setCreateForm({
      topicID: defaultTopicID ? String(defaultTopicID) : "",
      topicCode: defaultTopicCode,
      newTitle: "",
      reason: "",
    });
    setCreateTemplateContext(initialCreateTemplateContext);
    setEditForm(initialUpdateForm);
    setReviewComment("");
    setPlaceOfBirth("");
    setGeneratedFile(null);
    setFieldErrors({});
    setBannerError(null);
    setAccessDenied(null);
    void loadRequests();
  }, [defaultTopicCode, defaultTopicID, initialMode, isOpen, loadRequests]);

  useEffect(() => {
    if (!isOpen) return;
    void loadDetail(selectedRequestId);
  }, [isOpen, loadDetail, selectedRequestId]);

  const openCreate = useCallback(async () => {
    if (hasPendingRequest) {
      setBannerError(
        "Bạn đang có đơn đổi đề tài ở trạng thái Pending nên không thể tạo mới thêm.",
      );
      return;
    }

    setLoadingForm(true);
    setFieldErrors({});
    setBannerError(null);
    try {
      const resolvedTemplateContext =
        createTemplateContext.studentProfile ||
        createTemplateContext.lecturerProfile ||
        createTemplateContext.reviewedByUserCode ||
        createTemplateContext.supervisorUserCode
          ? createTemplateContext
          : await loadTemplateContext(
              topicProposerUserCode,
              topicSupervisorUserCode,
            );
      const [response, createTemplateContextResult] = await Promise.all([
        getTopicRenameRequestCreateTemplate(),
        Promise.resolve(resolvedTemplateContext),
      ]);
      const payload = response.data ?? ({} as TopicRenameRequestCreateDto);
      setCreateForm({
        topicID:
          payload.topicID != null
            ? String(payload.topicID)
            : defaultTopicID
              ? String(defaultTopicID)
              : "",
        topicCode: payload.topicCode ?? defaultTopicCode ?? "",
        newTitle: payload.newTitle ?? "",
        reason: payload.reason ?? "",
      });
      setCreateTemplateContext(createTemplateContextResult);
      setPanelMode("create");
    } catch (error) {
      if (error instanceof FetchDataError && error.status === 403) {
        setAccessDenied("Bạn không đủ quyền tạo đơn xin đổi đề tài.");
      }
      setBannerError(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu tạo mới.",
      );
    } finally {
      setLoadingForm(false);
    }
  }, [
    createTemplateContext,
    defaultTopicCode,
    defaultTopicID,
    hasPendingRequest,
    loadTemplateContext,
    topicProposerUserCode,
    topicSupervisorUserCode,
  ]);

  const openEdit = useCallback(
    async (id: number | null) => {
      const requestId =
        id ??
        selectedRequestId ??
        selectedRequest?.topicRenameRequestID ??
        null;
      if (requestId === null || requestId === undefined) return;

      setFieldErrors({});
      setBannerError(null);
      setLoadingForm(true);
      try {
        const response = await getTopicRenameRequestUpdateTemplate(requestId);
        const payload = response.data ?? { newTitle: "", reason: "" };
        setEditForm({
          newTitle: String(
            payload.newTitle ?? selectedRequest?.newTitle ?? "",
          ).trim(),
          reason: String(
            payload.reason ?? selectedRequest?.reason ?? "",
          ).trim(),
        });
        setPanelMode("edit");
      } catch (error) {
        if (error instanceof FetchDataError && error.status === 403) {
          setAccessDenied("Bạn không đủ quyền sửa đơn xin đổi đề tài.");
        }
        if (error instanceof FetchDataError && error.status === 404) {
          setBannerError("Không tìm thấy đơn xin đổi đề tài");
          return;
        }
        setBannerError(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu sửa đơn xin đổi đề tài.",
        );
      } finally {
        setLoadingForm(false);
      }
    },
    [
      selectedRequest?.newTitle,
      selectedRequest?.reason,
      selectedRequest?.topicRenameRequestID,
      selectedRequestId,
    ],
  );

  const submitCreate = useCallback(async () => {
    const topicID = toNumber(createForm.topicID);
    const topicCode = createForm.topicCode.trim();

    if (!topicID && !topicCode) {
      setFieldErrors({
        topicID: "Vui lòng nhập topicID hoặc topicCode.",
        topicCode: "Vui lòng nhập topicID hoặc topicCode.",
      });
      return;
    }
    if (!createForm.newTitle.trim()) {
      setFieldErrors({ newTitle: "Vui lòng nhập tên đề tài mới." });
      return;
    }
    if (!createForm.reason.trim()) {
      setFieldErrors({ reason: "Vui lòng nhập lý do đổi đề tài." });
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const templateContext = await loadTemplateContext(
        topicProposerUserCode,
        topicSupervisorUserCode,
      );
      const resolvedSupervisorUserCode =
        templateContext.supervisorUserCode ?? topicSupervisorUserCode ?? null;
      const reviewedByUserCode =
        templateContext.reviewedByUserCode ?? resolvedSupervisorUserCode;
      const payload: TopicRenameRequestCreateDto = {
        topicID,
        topicCode: topicCode || null,
        newTitle: createForm.newTitle.trim(),
        reason: createForm.reason.trim(),
        requestedByUserCode: auth.user?.userCode ?? null,
        requestedByRole: currentRole || null,
        reviewedByUserCode,
        reviewedByRole: reviewedByUserCode ? ROLE_LECTURER : null,
        proposerUserCode:
          templateContext.proposerUserCode ?? topicProposerUserCode ?? null,
        proposerStudentCode:
          templateContext.studentProfile?.studentCode ?? null,
        supervisorUserCode: resolvedSupervisorUserCode,
        supervisorLecturerCode:
          templateContext.lecturerProfile?.lecturerCode ?? null,
        studentFullName: templateContext.studentProfile?.fullName ?? null,
        studentCode: templateContext.studentProfile?.studentCode ?? null,
        studentEmail: templateContext.studentProfile?.studentEmail ?? null,
        studentPhoneNumber: templateContext.studentProfile?.phoneNumber ?? null,
        studentDateOfBirth: templateContext.studentProfile?.dateOfBirth ?? null,
        studentGender: templateContext.studentProfile?.gender ?? null,
        studentDepartmentCode:
          templateContext.studentProfile?.departmentCode ?? null,
        studentClassCode: templateContext.studentProfile?.classCode ?? null,
        studentFacultyCode: templateContext.studentProfile?.facultyCode ?? null,
        studentEnrollmentYear:
          templateContext.studentProfile?.enrollmentYear ?? null,
        studentStatus: templateContext.studentProfile?.status ?? null,
        studentAddress: templateContext.studentProfile?.address ?? null,
        lecturerFullName: templateContext.lecturerProfile?.fullName ?? null,
        lecturerCode: templateContext.lecturerProfile?.lecturerCode ?? null,
        lecturerEmail: templateContext.lecturerProfile?.email ?? null,
        lecturerPhoneNumber:
          templateContext.lecturerProfile?.phoneNumber ?? null,
        lecturerDateOfBirth:
          templateContext.lecturerProfile?.dateOfBirth ?? null,
        lecturerGender: templateContext.lecturerProfile?.gender ?? null,
        lecturerDepartmentCode:
          templateContext.lecturerProfile?.departmentCode ?? null,
        lecturerDegree: templateContext.lecturerProfile?.degree ?? null,
        lecturerAddress: templateContext.lecturerProfile?.address ?? null,
      };

      const response = await createTopicRenameRequest(payload);
      addToast("Đã tạo đơn xin đổi đề tài.", "success");
      setPanelMode("detail");
      await loadRequests();

      const createdId = getRequestId(response.data);
      if (createdId) {
        setSelectedRequestId(createdId);
        await loadDetail(createdId);
      }
    } catch (error) {
      if (error instanceof FetchDataError && error.status === 403) {
        setAccessDenied("Bạn không đủ quyền tạo đơn xin đổi đề tài.");
      }
      const validation = extractValidationMessages(error);
      if (Object.keys(validation).length > 0) {
        setFieldErrors(validation);
      }
      addToast(
        error instanceof Error
          ? error.message
          : "Không thể tạo đơn xin đổi đề tài.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }, [
    addToast,
    auth.user?.userCode,
    currentRole,
    createForm,
    loadDetail,
    loadRequests,
    loadTemplateContext,
    topicProposerUserCode,
    topicSupervisorUserCode,
  ]);

  const submitEdit = useCallback(async () => {
    const requestId = activeRequestId;
    if (requestId === null || requestId === undefined) return;
    if (!isEditableStatus(currentStatus)) {
      addToast(
        "Đơn chỉ được sửa khi ở trạng thái Pending hoặc Rejected.",
        "warning",
      );
      return;
    }

    if (!editForm.newTitle.trim()) {
      setFieldErrors({ newTitle: "Vui lòng nhập tên đề tài mới." });
      return;
    }
    if (!editForm.reason.trim()) {
      setFieldErrors({ reason: "Vui lòng nhập lý do đổi đề tài." });
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      await updateTopicRenameRequest(requestId, {
        newTitle: editForm.newTitle.trim(),
        reason: editForm.reason.trim(),
      });
      setRequests((prev) =>
        prev.map((item) =>
          item.topicRenameRequestID === requestId
            ? {
                ...item,
                status: "Pending",
                reviewedAt: "",
                reviewedByUserCode: "",
                reviewedByName: "",
                reviewedByLecturerCode: "",
                reviewedByRole: "",
                raw: {
                  ...item.raw,
                  status: "Pending",
                  Status: "Pending",
                  reviewedAt: "",
                  ReviewedAt: "",
                  reviewedByUserCode: "",
                  ReviewedByUserCode: "",
                  reviewedByName: "",
                  ReviewedByName: "",
                  reviewedByLecturerCode: "",
                  ReviewedByLecturerCode: "",
                  reviewedByRole: "",
                  ReviewedByRole: "",
                },
              }
            : item,
        ),
      );
      setDetail((prev) => {
        if (!prev?.request) return prev;
        return {
          ...prev,
          request: {
            ...prev.request,
            status: "Pending",
            Status: "Pending",
            reviewedAt: "",
            ReviewedAt: "",
            reviewedByUserCode: "",
            ReviewedByUserCode: "",
            reviewedByName: "",
            ReviewedByName: "",
            reviewedByLecturerCode: "",
            ReviewedByLecturerCode: "",
            reviewedByRole: "",
            ReviewedByRole: "",
          },
        };
      });
      addToast("Đã cập nhật đơn xin đổi đề tài.", "success");
      setPanelMode("detail");
      await loadRequests();
      await loadDetail(requestId);
    } catch (error) {
      if (error instanceof FetchDataError && error.status === 403) {
        setAccessDenied("Bạn không đủ quyền sửa đơn xin đổi đề tài.");
      }
      const validation = extractValidationMessages(error);
      if (Object.keys(validation).length > 0) {
        setFieldErrors(validation);
      }
      addToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật đơn xin đổi đề tài.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }, [
    addToast,
    activeRequestId,
    currentStatus,
    editForm.newTitle,
    editForm.reason,
    loadDetail,
    loadRequests,
  ]);

  const submitDelete = useCallback(async () => {
    const requestId = activeRequestId;
    if (requestId === null || requestId === undefined) return;

    setSaving(true);
    try {
      await deleteTopicRenameRequest(requestId);
      addToast("Đã xóa đơn xin đổi đề tài.", "success");
      setIsDeleteConfirmOpen(false);
      setSelectedRequestId(null);
      setDetail(null);
      setPanelMode("detail");
      await loadRequests();
    } catch (error) {
      if (error instanceof FetchDataError && error.status === 403) {
        setAccessDenied("Bạn không đủ quyền xóa đơn xin đổi đề tài.");
      }
      addToast(
        error instanceof Error
          ? error.message
          : "Không thể xóa đơn xin đổi đề tài.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }, [addToast, activeRequestId, loadRequests]);

  const submitReview = useCallback(
    async (action: TopicRenameRequestReviewAction) => {
      if (selectedRequestId === null || selectedRequestId === undefined) return;

      const label = action === "Approve" ? "duyệt" : "từ chối";
      const confirmed = window.confirm(`Bạn có chắc muốn ${label} đơn này?`);
      if (!confirmed) return;

      setSaving(true);
      setFieldErrors({});
      try {
        const payload: TopicRenameRequestReviewDto = {
          action,
          comment: reviewComment.trim() || null,
        };
        await reviewTopicRenameRequest(selectedRequestId, payload);
        addToast(
          action === "Approve"
            ? "Đã duyệt đơn xin đổi đề tài."
            : "Đã từ chối đơn xin đổi đề tài.",
          "success",
        );
        setReviewComment("");
        setPanelMode("detail");
        await loadRequests();
        await loadDetail(selectedRequestId);
      } catch (error) {
        if (error instanceof FetchDataError && error.status === 403) {
          setAccessDenied("Bạn không đủ quyền duyệt đơn xin đổi đề tài.");
        }
        const validation = extractValidationMessages(error);
        if (Object.keys(validation).length > 0) {
          setFieldErrors(validation);
        }
        addToast(
          error instanceof Error
            ? error.message
            : "Không thể xử lý duyệt đơn xin đổi đề tài.",
          "error",
        );
      } finally {
        setSaving(false);
      }
    },
    [addToast, loadDetail, loadRequests, reviewComment, selectedRequestId],
  );

  const submitGenerateTemplate = useCallback(async () => {
    if (selectedRequestId === null || selectedRequestId === undefined) return;

    setSaving(true);
    try {
      const response = await generateTopicRenameRequestTemplate(
        selectedRequestId,
        placeOfBirth.trim() || undefined,
      );
      const fileData = response.data as TopicRenameRequestFileReadDto | null;
      if (fileData) {
        setGeneratedFile(fileData);
      }
      addToast("Đã sinh file Word mẫu.", "success");
      await loadDetail(selectedRequestId);
    } catch (error) {
      if (error instanceof FetchDataError && error.status === 403) {
        setAccessDenied("Bạn không đủ quyền sinh file Word mẫu.");
      }
      addToast(
        error instanceof Error
          ? error.message
          : "Không thể sinh file Word mẫu.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }, [addToast, loadDetail, placeOfBirth, selectedRequestId]);

  const downloadFile = useCallback(
    (file: TopicRenameRequestFileReadDto) => {
      const url = normalizeUrl(file.fileUrl);
      if (!url) {
        addToast("Không có đường dẫn tải xuống hợp lệ.", "error");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [addToast],
  );

  const deleteTemplateFile = useCallback(async () => {
    if (selectedRequestId === null || selectedRequestId === undefined) {
      addToast("Không xác định được request để xóa file template.", "error");
      return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn xóa file này không?");
    if (!confirmed) {
      return;
    }

    setDeletingTemplateFile(true);
    try {
      await deleteTopicRenameRequestTemplate(selectedRequestId);
      addToast("Đã xóa file template.", "success");

      setGeneratedFile(null);
      await loadDetail(selectedRequestId);
    } catch (error) {
      if (error instanceof FetchDataError && error.status === 403) {
        setAccessDenied("Bạn không đủ quyền xóa file template.");
      }
      addToast(
        error instanceof Error ? error.message : "Không thể xóa file template.",
        "error",
      );
    } finally {
      setDeletingTemplateFile(false);
    }
  }, [addToast, loadDetail, selectedRequestId]);

  const detailFiles = useMemo(() => detail?.files ?? [], [detail?.files]);

  const currentFile = useMemo(() => {
    if (generatedFile) {
      return generatedFile;
    }
    return detailFiles.find((file) => file.isCurrent) || detailFiles[0] || null;
  }, [detailFiles, generatedFile]);

  const detailFilesToRender = useMemo(
    () => detailFiles.filter((file) => !isSameFileEntry(file, currentFile)),
    [currentFile, detailFiles],
  );

  const templatePreview = useMemo(() => {
    const studentProfile = createTemplateContext.studentProfile;
    const lecturerProfile = createTemplateContext.lecturerProfile;
    const merged: Record<string, unknown> = {
      topicID: currentTopic?.topicID ?? selectedRequest?.topicID ?? null,
      topicCode:
        currentTopic?.topicCode ??
        selectedRequest?.topicCode ??
        defaultTopicCode ??
        "",
      title: currentTopic?.title ?? defaultTopicTitle ?? "",
      oldTitle:
        selectedRequest?.oldTitle ??
        currentTopic?.title ??
        defaultTopicTitle ??
        "",
      newTitle: selectedRequest?.newTitle ?? "",
      requestCode: selectedRequest?.requestCode ?? "",
      requestedByUserCode: selectedRequest?.requestedByUserCode ?? "",
      requestedByRole: selectedRequest?.requestedByRole ?? "",
      reviewedByUserCode:
        selectedRequest?.reviewedByUserCode ??
        createTemplateContext.reviewedByUserCode ??
        topicSupervisorUserCode ??
        "",
      reviewedByRole:
        selectedRequest?.reviewedByRole ??
        createTemplateContext.reviewedByRole ??
        (topicSupervisorUserCode ? ROLE_LECTURER : ""),
      status: selectedRequest?.status ?? "",
      reason: selectedRequest?.reason ?? "",
      proposerUserCode:
        createTemplateContext.proposerUserCode ?? topicProposerUserCode ?? "",
      supervisorUserCode:
        createTemplateContext.supervisorUserCode ??
        topicSupervisorUserCode ??
        "",
      fullName: studentProfile?.fullName ?? "",
      dateOfBirth: studentProfile?.dateOfBirth ?? "",
      phoneNumber: studentProfile?.phoneNumber ?? "",
      email: studentProfile?.studentEmail ?? "",
      classCode: studentProfile?.classCode ?? "",
      major:
        studentProfile?.facultyCode ?? studentProfile?.departmentCode ?? "",
      departmentCode:
        studentProfile?.departmentCode ?? lecturerProfile?.departmentCode ?? "",
      departmentName:
        studentProfile?.departmentCode ?? lecturerProfile?.departmentCode ?? "",
      enrollmentYear: studentProfile?.enrollmentYear ?? "",
      gender: studentProfile?.gender ?? "",
      address: studentProfile?.address ?? lecturerProfile?.address ?? "",
      studentFullName: studentProfile?.fullName ?? "",
      studentName: studentProfile?.fullName ?? "",
      studentCode: studentProfile?.studentCode ?? "",
      studentEmail: studentProfile?.studentEmail ?? "",
      studentPhoneNumber: studentProfile?.phoneNumber ?? "",
      studentDateOfBirth: studentProfile?.dateOfBirth ?? "",
      studentGender: studentProfile?.gender ?? "",
      studentDepartmentCode: studentProfile?.departmentCode ?? "",
      studentClassCode: studentProfile?.classCode ?? "",
      studentFacultyCode: studentProfile?.facultyCode ?? "",
      studentEnrollmentYear: studentProfile?.enrollmentYear ?? "",
      studentStatus: studentProfile?.status ?? "",
      studentAddress: studentProfile?.address ?? "",
      supervisorName: lecturerProfile?.fullName ?? "",
      supervisor: lecturerProfile?.fullName ?? "",
      lecturerName: lecturerProfile?.fullName ?? "",
      lecturerFullName: lecturerProfile?.fullName ?? "",
      lecturerCode: lecturerProfile?.lecturerCode ?? "",
      lecturerEmail: lecturerProfile?.email ?? "",
      lecturerPhoneNumber: lecturerProfile?.phoneNumber ?? "",
      lecturerDateOfBirth: lecturerProfile?.dateOfBirth ?? "",
      lecturerGender: lecturerProfile?.gender ?? "",
      lecturerDepartmentCode: lecturerProfile?.departmentCode ?? "",
      lecturerDegree: lecturerProfile?.degree ?? "",
      lecturerAddress: lecturerProfile?.address ?? "",
    };

    if (selectedRequest?.raw && typeof selectedRequest.raw === "object") {
      Object.assign(merged, selectedRequest.raw);
    }

    if (detail?.request && typeof detail.request === "object") {
      Object.assign(merged, detail.request);
    }

    if (detail?.templateData && typeof detail.templateData === "object") {
      Object.assign(merged, detail.templateData);
    }

    const mergedLookup = buildFieldLookup(merged);
    const mergedValue = (keys: string[]) =>
      readFieldFromLookup(mergedLookup, keys, "");

    const resolvedRequestedByUserCode = pickFirstNonEmpty(
      selectedRequest?.requestedByUserCode,
      mergedValue(["requestedByUserCode", "RequestedByUserCode"]),
      auth.user?.userCode,
    );
    const resolvedRequestedByRole = pickFirstNonEmpty(
      selectedRequest?.requestedByRole,
      mergedValue(["requestedByRole", "RequestedByRole"]),
      currentRole,
    );
    const resolvedReviewedByUserCode = pickFirstNonEmpty(
      selectedRequest?.reviewedByUserCode,
      createTemplateContext.reviewedByUserCode,
      topicSupervisorUserCode,
      mergedValue(["reviewedByUserCode", "ReviewedByUserCode"]),
    );
    const resolvedReviewedByRole = pickFirstNonEmpty(
      selectedRequest?.reviewedByRole,
      createTemplateContext.reviewedByRole,
      mergedValue(["reviewedByRole", "ReviewedByRole"]),
      resolvedReviewedByUserCode ? ROLE_LECTURER : "",
    );

    const resolvedProposerUserCode = pickFirstNonEmpty(
      createTemplateContext.proposerUserCode,
      topicProposerUserCode,
      mergedValue(["proposerUserCode", "ProposerUserCode"]),
    );
    const resolvedSupervisorUserCode = pickFirstNonEmpty(
      createTemplateContext.supervisorUserCode,
      topicSupervisorUserCode,
      mergedValue(["supervisorUserCode", "SupervisorUserCode"]),
    );

    const resolvedStudentFullName = pickFirstNonEmpty(
      studentProfile?.fullName,
      mergedValue([
        "studentFullName",
        "StudentFullName",
        "studentName",
        "fullName",
        "FullName",
      ]),
    );
    const resolvedDateOfBirth = pickFirstNonEmpty(
      studentProfile?.dateOfBirth,
      mergedValue(["dateOfBirth", "DateOfBirth", "birthday"]),
    );
    const resolvedPhoneNumber = pickFirstNonEmpty(
      studentProfile?.phoneNumber,
      mergedValue([
        "phoneNumber",
        "PhoneNumber",
        "studentPhoneNumber",
        "StudentPhoneNumber",
      ]),
    );
    const resolvedEmail = pickFirstNonEmpty(
      studentProfile?.studentEmail,
      mergedValue(["email", "Email", "studentEmail", "StudentEmail"]),
    );
    const resolvedClassCode = pickFirstNonEmpty(
      studentProfile?.classCode,
      mergedValue([
        "classCode",
        "ClassCode",
        "studentClassCode",
        "StudentClassCode",
      ]),
    );
    const resolvedMajor = pickFirstNonEmpty(
      mergedValue(["major", "Major", "specialization"]),
      studentProfile?.facultyCode,
      studentProfile?.departmentCode,
    );
    const resolvedDepartmentCode = pickFirstNonEmpty(
      mergedValue([
        "departmentCode",
        "DepartmentCode",
        "studentDepartmentCode",
        "StudentDepartmentCode",
      ]),
      studentProfile?.departmentCode,
      lecturerProfile?.departmentCode,
    );
    const resolvedDepartmentName = pickFirstNonEmpty(
      mergedValue(["departmentName", "DepartmentName"]),
      studentProfile?.departmentCode,
      lecturerProfile?.departmentCode,
    );
    const resolvedEnrollmentYear = pickFirstNonEmpty(
      studentProfile?.enrollmentYear,
      mergedValue(["enrollmentYear", "EnrollmentYear", "cohort"]),
    );
    const resolvedGender = pickFirstNonEmpty(
      studentProfile?.gender,
      mergedValue(["gender", "Gender", "studentGender", "StudentGender"]),
    );
    const resolvedAddress = pickFirstNonEmpty(
      studentProfile?.address,
      lecturerProfile?.address,
      mergedValue(["address", "Address", "studentAddress", "StudentAddress"]),
    );
    const resolvedStudentCode = pickFirstNonEmpty(
      studentProfile?.studentCode,
      mergedValue(["studentCode", "StudentCode"]),
    );
    const resolvedStudentStatus = pickFirstNonEmpty(
      studentProfile?.status,
      mergedValue(["studentStatus", "StudentStatus", "status", "Status"]),
    );

    const resolvedLecturerName = pickFirstNonEmpty(
      lecturerProfile?.fullName,
      mergedValue([
        "supervisorName",
        "supervisor",
        "lecturerName",
        "lecturerFullName",
      ]),
    );
    const resolvedLecturerCode = pickFirstNonEmpty(
      lecturerProfile?.lecturerCode,
      mergedValue(["lecturerCode", "LecturerCode"]),
    );
    const resolvedLecturerEmail = pickFirstNonEmpty(
      lecturerProfile?.email,
      mergedValue(["lecturerEmail", "LecturerEmail"]),
    );
    const resolvedLecturerPhone = pickFirstNonEmpty(
      lecturerProfile?.phoneNumber,
      mergedValue(["lecturerPhoneNumber", "LecturerPhoneNumber"]),
    );
    const resolvedLecturerDateOfBirth = pickFirstNonEmpty(
      lecturerProfile?.dateOfBirth,
      mergedValue(["lecturerDateOfBirth", "LecturerDateOfBirth"]),
    );
    const resolvedLecturerGender = pickFirstNonEmpty(
      lecturerProfile?.gender,
      mergedValue(["lecturerGender", "LecturerGender"]),
    );
    const resolvedLecturerDepartment = pickFirstNonEmpty(
      lecturerProfile?.departmentCode,
      mergedValue(["lecturerDepartmentCode", "LecturerDepartmentCode"]),
    );
    const resolvedLecturerDegree = pickFirstNonEmpty(
      lecturerProfile?.degree,
      mergedValue(["lecturerDegree", "LecturerDegree"]),
    );
    const resolvedLecturerAddress = pickFirstNonEmpty(
      lecturerProfile?.address,
      mergedValue(["lecturerAddress", "LecturerAddress"]),
    );

    Object.assign(merged, {
      requestCode: pickFirstNonEmpty(
        selectedRequest?.requestCode,
        mergedValue(["requestCode", "RequestCode"]),
      ),
      status: pickFirstNonEmpty(
        selectedRequest?.status,
        mergedValue(["status", "Status"]),
      ),
      requestedByUserCode: resolvedRequestedByUserCode,
      requestedByRole: resolvedRequestedByRole,
      reviewedByUserCode: resolvedReviewedByUserCode,
      reviewedByRole: resolvedReviewedByRole,
      proposerUserCode: resolvedProposerUserCode,
      supervisorUserCode: resolvedSupervisorUserCode,
      fullName: resolvedStudentFullName,
      dateOfBirth: resolvedDateOfBirth,
      phoneNumber: resolvedPhoneNumber,
      email: resolvedEmail,
      classCode: resolvedClassCode,
      major: resolvedMajor,
      departmentCode: resolvedDepartmentCode,
      departmentName: resolvedDepartmentName,
      enrollmentYear: resolvedEnrollmentYear,
      gender: resolvedGender,
      address: resolvedAddress,
      studentFullName: resolvedStudentFullName,
      studentName: resolvedStudentFullName,
      studentCode: resolvedStudentCode,
      studentEmail: resolvedEmail,
      studentPhoneNumber: resolvedPhoneNumber,
      studentDateOfBirth: resolvedDateOfBirth,
      studentGender: resolvedGender,
      studentDepartmentCode: resolvedDepartmentCode,
      studentClassCode: resolvedClassCode,
      studentFacultyCode: pickFirstNonEmpty(
        studentProfile?.facultyCode,
        mergedValue(["studentFacultyCode", "StudentFacultyCode"]),
      ),
      studentEnrollmentYear: resolvedEnrollmentYear,
      studentStatus: resolvedStudentStatus,
      studentAddress: resolvedAddress,
      supervisorName: resolvedLecturerName,
      supervisor: resolvedLecturerName,
      lecturerName: resolvedLecturerName,
      lecturerFullName: resolvedLecturerName,
      lecturerCode: resolvedLecturerCode,
      lecturerEmail: resolvedLecturerEmail,
      lecturerPhoneNumber: resolvedLecturerPhone,
      lecturerDateOfBirth: resolvedLecturerDateOfBirth,
      lecturerGender: resolvedLecturerGender,
      lecturerDepartmentCode: resolvedLecturerDepartment,
      lecturerDegree: resolvedLecturerDegree,
      lecturerAddress: resolvedLecturerAddress,
    });

    if (studentProfile) {
      Object.assign(merged, {
        studentProfile,
      });
    }

    if (lecturerProfile) {
      Object.assign(merged, {
        lecturerProfile,
      });
    }

    return merged;
  }, [
    currentTopic?.title,
    currentTopic?.topicCode,
    currentTopic?.topicID,
    defaultTopicCode,
    defaultTopicTitle,
    auth.user?.userCode,
    currentRole,
    detail?.request,
    detail?.templateData,
    createTemplateContext.lecturerProfile,
    createTemplateContext.proposerUserCode,
    createTemplateContext.reviewedByRole,
    createTemplateContext.reviewedByUserCode,
    createTemplateContext.studentProfile,
    createTemplateContext.supervisorUserCode,
    topicProposerUserCode,
    topicSupervisorUserCode,
    selectedRequest?.newTitle,
    selectedRequest?.oldTitle,
    selectedRequest?.raw,
    selectedRequest?.reason,
    selectedRequest?.requestedByRole,
    selectedRequest?.requestedByUserCode,
    selectedRequest?.requestCode,
    selectedRequest?.reviewedByRole,
    selectedRequest?.reviewedByUserCode,
    selectedRequest?.status,
    selectedRequest?.topicCode,
    selectedRequest?.topicID,
  ]);
  const templatePreviewLookup = useMemo(
    () => buildFieldLookup(templatePreview),
    [templatePreview],
  );
  const templatePlaceOfBirth = useMemo(
    () =>
      readFieldFromLookup(
        templatePreviewLookup,
        ["placeOfBirth", "PlaceOfBirth"],
        "",
      ),
    [templatePreviewLookup],
  );
  const historyRows = detail?.history ?? [];

  useEffect(() => {
    if (!placeOfBirth.trim() && templatePlaceOfBirth) {
      setPlaceOfBirth(templatePlaceOfBirth);
    }
  }, [placeOfBirth, templatePlaceOfBirth]);

  const selectedTopicLabel =
    currentTopic?.title ||
    selectedRequest?.oldTitle ||
    defaultTopicTitle ||
    "Chưa chọn đề tài";
  const selectedTopicCode =
    currentTopic?.topicCode ||
    selectedRequest?.topicCode ||
    defaultTopicCode ||
    "--";

  const renderRequestOverview = () => {
    const request = templatePreview;
    const isEditMode = panelMode === "edit";
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div style={cardStyles.section}>
          <div style={cardStyles.sectionHeader}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
                Đề tài hiện tại
              </div>
              <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
                {selectedTopicLabel}
              </div>
            </div>
          </div>
          <div style={cardStyles.sectionBody}>
            <div>
              <strong>Mã đề tài:</strong> {selectedTopicCode}
            </div>
            <div>
              <strong>Tên đề tài:</strong> {selectedTopicLabel}
            </div>
          </div>
        </div>

        <div style={cardStyles.section}>
          <div style={cardStyles.sectionHeader}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                {selectedRequest?.requestCode || "Đơn xin đổi đề tài"}
              </div>
              <div style={{ marginTop: 4, color: "#475569", fontSize: 12 }}>
                {selectedRequest?.createdAt ||
                  readField(request, ["createdAt", "CreatedAt"], "") ||
                  "Chưa có thời gian tạo"}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginLeft: "auto",
              }}
            >
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${statusColors.border}`,
                  background: statusColors.bg,
                  color: statusColors.text,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "capitalize",
                }}
              >
                {selectedRequest?.status || "Unknown"}
              </span>
              {canReviewSelected ? (
                <>
                  <button
                    type="button"
                    style={actionButtonPrimary}
                    onClick={() => void submitReview("Approve")}
                    disabled={
                      saving || !selectedRequestId || !canReviewSelected
                    }
                  >
                    <CheckCircle size={14} /> Duyệt
                  </button>
                  <button
                    type="button"
                    style={actionButtonDanger}
                    onClick={() => void submitReview("Reject")}
                    disabled={
                      saving || !selectedRequestId || !canReviewSelected
                    }
                  >
                    <AlertCircle size={14} /> Từ chối
                  </button>
                </>
              ) : null}
              {panelMode === "detail" && !selectedRequest ? (
                <button
                  type="button"
                  style={actionButtonPrimary}
                  onClick={() => void openCreate()}
                  disabled={loadingForm || saving || !canCreateNew}
                >
                  <Plus size={14} /> Tạo mới
                </button>
              ) : null}
              {panelMode === "detail" &&
              selectedRequest &&
              canModifySelected ? (
                <>
                  <button
                    type="button"
                    style={actionButtonGhost}
                    onClick={() => void openEdit(activeRequestId)}
                    disabled={
                      saving ||
                      loadingForm ||
                      !hasActiveRequest ||
                      !canEditSelected
                    }
                  >
                    <Edit size={14} /> Sửa
                  </button>
                  {canDeleteSelected ? (
                    <button
                      type="button"
                      style={actionButtonDanger}
                      onClick={() => {
                        if (!hasActiveRequest) return;
                        setIsDeleteConfirmOpen(true);
                      }}
                      disabled={saving || loadingForm || !hasActiveRequest}
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
          <div style={cardStyles.sectionBody}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  label: "Mã request",
                  value:
                    selectedRequest?.requestCode ||
                    readField(request, ["requestCode", "RequestCode"], "-"),
                },
                { label: "Mã đề tài", value: selectedTopicCode },
                {
                  label: "Tên đề tài hiện tại",
                  value: readField(
                    request,
                    ["oldTitle", "OldTitle"],
                    selectedTopicLabel,
                  ),
                },
                {
                  label: "Tên đề tài mới",
                  value: readField(request, ["newTitle", "NewTitle"], "-"),
                  editable: true,
                },
                {
                  label: "Người tạo",
                  value: readField(
                    request,
                    ["requestedByUserCode", "RequestedByUserCode"],
                    "-",
                  ),
                },
                {
                  label: "Vai trò người tạo",
                  value: readField(
                    request,
                    ["requestedByRole", "RequestedByRole"],
                    "-",
                  ),
                },
                {
                  label: "Người duyệt",
                  value: readField(
                    request,
                    ["reviewedByUserCode", "ReviewedByUserCode"],
                    "-",
                  ),
                },
                {
                  label: "Vai trò người duyệt",
                  value: readField(
                    request,
                    ["reviewedByRole", "ReviewedByRole"],
                    "-",
                  ),
                },
                {
                  label: "Thời gian tạo",
                  value: readField(request, ["createdAt", "CreatedAt"], "-"),
                },
                {
                  label: "Thời gian duyệt",
                  value: readField(request, ["reviewedAt", "ReviewedAt"], "-"),
                },
                {
                  label: "Thời gian áp dụng",
                  value: readField(request, ["appliedAt", "AppliedAt"], "-"),
                },
                {
                  label: "Lý do đổi",
                  value: readField(request, ["reason", "Reason"], "-"),
                  editable: true,
                  wide: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "grid",
                    gap: 4,
                    gridColumn: item.wide ? "1 / -1" : undefined,
                  }}
                >
                  <div
                    style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}
                  >
                    {item.label}
                  </div>
                  {isEditMode && item.editable ? (
                    item.label === "Lý do đổi" ? (
                      <textarea
                        value={editForm.reason}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            reason: e.target.value,
                          }))
                        }
                        style={textareaStyle}
                        placeholder="Nhập lý do đổi đề tài"
                      />
                    ) : (
                      <input
                        value={editForm.newTitle}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            newTitle: e.target.value,
                          }))
                        }
                        style={inputStyle}
                        placeholder="Nhập tên đề tài mới"
                      />
                    )
                  ) : (
                    <div
                      style={{
                        fontSize: 14,
                        color: "#0f172a",
                        fontWeight: 600,
                        lineHeight: 1.45,
                      }}
                    >
                      {item.value || "-"}
                    </div>
                  )}
                  {isEditMode &&
                  item.label === "Tên đề tài mới" &&
                  fieldErrors.newTitle ? (
                    <small style={{ color: "#b91c1c" }}>
                      {fieldErrors.newTitle}
                    </small>
                  ) : null}
                  {isEditMode &&
                  item.label === "Lý do đổi" &&
                  fieldErrors.reason ? (
                    <small style={{ color: "#b91c1c" }}>
                      {fieldErrors.reason}
                    </small>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={cardStyles.section}>
          <div style={cardStyles.sectionHeader}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
                Danh sách file
              </div>
              <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
                File đã sinh, file đính kèm và file hiện tại.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                style={actionButtonPrimary}
                onClick={() => void submitGenerateTemplate()}
                disabled={saving || !selectedRequestId}
              >
                <RefreshCw size={14} /> Sinh file Word mẫu
              </button>
            </div>
          </div>
          <div style={{ padding: 14, display: "grid", gap: 10 }}>
            {generatedFile ? (
              <div
                style={{
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: "#166534" }}>
                    File vừa sinh
                  </div>
                  <div style={{ fontSize: 12, color: "#14532d", marginTop: 4 }}>
                    {generatedFile.fileName || "File Word mẫu"}
                  </div>
                </div>
                <button
                  type="button"
                  style={actionButtonPrimary}
                  onClick={() => downloadFile(generatedFile)}
                >
                  <Download size={14} /> Tải xuống
                </button>
                <button
                  type="button"
                  style={actionButtonDanger}
                  onClick={() => void deleteTemplateFile()}
                  disabled={saving || deletingTemplateFile}
                >
                  {deletingTemplateFile ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}{" "}
                  Xóa
                </button>
              </div>
            ) : null}

            {currentFile ? (
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>
                    {currentFile.fileName || "File đính kèm"}
                    {currentFile.isCurrent ? " • Current" : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {currentFile.fileType || currentFile.storageProvider || "-"}
                  </div>
                </div>
                <button
                  type="button"
                  style={actionButtonGhost}
                  onClick={() => downloadFile(currentFile)}
                >
                  <Download size={14} /> Tải xuống
                </button>
                <button
                  type="button"
                  style={actionButtonDanger}
                  onClick={() => void deleteTemplateFile()}
                  disabled={saving || deletingTemplateFile}
                >
                  {deletingTemplateFile ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}{" "}
                  Xóa
                </button>
              </div>
            ) : null}

            {detailFilesToRender.length > 0 ? (
              detailFilesToRender.map((file, index) => (
                <div
                  key={`${file.fileName || file.fileUrl || index}`}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>
                      {file.fileName || "Không có tên file"}
                      {file.isCurrent ? " • Current" : ""}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}
                    >
                      {file.fileType || file.storageProvider || "-"}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={actionButtonGhost}
                    onClick={() => downloadFile(file)}
                  >
                    <Download size={14} /> Tải xuống
                  </button>
                  <button
                    type="button"
                    style={actionButtonDanger}
                    onClick={() => void deleteTemplateFile()}
                    disabled={saving || deletingTemplateFile}
                  >
                    {deletingTemplateFile ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}{" "}
                    Xóa
                  </button>
                </div>
              ))
            ) : !currentFile ? (
              <div style={{ color: "#64748b", fontSize: 13 }}>
                Chưa có file nào.
              </div>
            ) : null}
          </div>
        </div>

        <div style={cardStyles.section}>
          <div style={cardStyles.sectionHeader}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
                Lịch sử đổi tên
              </div>
              <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
                Timeline theo mã history, lý do đổi và người duyệt thực tế.
              </div>
            </div>
          </div>
          <div style={{ padding: 14, overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1100,
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th
                    style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}
                  >
                    Mã request
                  </th>
                  <th
                    style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}
                  >
                    Mã đề tài
                  </th>
                  <th
                    style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}
                  >
                    Tên trước
                  </th>
                  <th
                    style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}
                  >
                    Tên mới
                  </th>
                  <th
                    style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}
                  >
                    Lý do đổi
                  </th>
                  <th
                    style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}
                  >
                    Ghi chú duyệt
                  </th>
                  <th
                    style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}
                  >
                    Người thay đổi
                  </th>
                  <th
                    style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}
                  >
                    Người duyệt
                  </th>
                </tr>
              </thead>
              <tbody>
                {historyRows.length > 0 ? (
                  historyRows.map((item, index) => (
                    <tr
                      key={
                        item.historyCode ||
                        `${item.historyId || item.effectiveAt}-${index}`
                      }
                    >
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid #edf2f7",
                        }}
                      >
                        {formatDisplay(item.requestCode)}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid #edf2f7",
                        }}
                      >
                        {formatDisplay(item.topicCode)}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid #edf2f7",
                        }}
                      >
                        {formatDisplay(item.previousTitle, "Chưa có")}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid #edf2f7",
                        }}
                      >
                        {formatDisplay(item.newTitle, "Chưa có")}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid #edf2f7",
                        }}
                      >
                        {formatDisplay(item.changeReason, "-")}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid #edf2f7",
                        }}
                      >
                        {formatDisplay(item.approvalComment, "-")}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid #edf2f7",
                        }}
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <span style={{ fontWeight: 700 }}>
                            {formatDisplay(item.changedByUserCode, "-")}
                          </span>
                          <span style={{ color: "#64748b", fontSize: 12 }}>
                            {formatDisplay(item.changedByRole, "-")}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid #edf2f7",
                        }}
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <span style={{ fontWeight: 700 }}>
                            {formatDisplay(item.approvedByUserCode, "-")}
                          </span>
                          <span style={{ color: "#64748b", fontSize: 12 }}>
                            {formatDisplay(item.approvedByRole, "-")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: 14, color: "#64748b" }}>
                      Chưa có lịch sử đổi tên.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderForm = () => {
    if (panelMode === "create") {
      return (
        <div style={cardStyles.section}>
          <div style={cardStyles.sectionHeader}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 15 }}>
                Tạo mới
              </div>
              <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
                Chỉ cần topicID hoặc topicCode và tên đề tài mới.
              </div>
            </div>
          </div>
          <div style={cardStyles.sectionBody}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>topicID</span>
                <input
                  value={createForm.topicID}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      topicID: e.target.value,
                    }))
                  }
                  placeholder="Nhập topicID"
                  style={inputStyle}
                />
                {fieldErrors.topicID ? (
                  <small style={{ color: "#b91c1c" }}>
                    {fieldErrors.topicID}
                  </small>
                ) : null}
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>topicCode</span>
                <input
                  value={createForm.topicCode}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      topicCode: e.target.value,
                    }))
                  }
                  placeholder="Nhập topicCode"
                  style={inputStyle}
                />
                {fieldErrors.topicCode ? (
                  <small style={{ color: "#b91c1c" }}>
                    {fieldErrors.topicCode}
                  </small>
                ) : null}
              </label>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 12 }}>
                Tên đề tài mới
              </span>
              <input
                value={createForm.newTitle}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    newTitle: e.target.value,
                  }))
                }
                placeholder="Nhập tên đề tài mới"
                style={inputStyle}
              />
              {fieldErrors.newTitle ? (
                <small style={{ color: "#b91c1c" }}>
                  {fieldErrors.newTitle}
                </small>
              ) : null}
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 12 }}>Lý do đổi</span>
              <textarea
                value={createForm.reason}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Nhập lý do đổi đề tài"
                style={textareaStyle}
              />
              {fieldErrors.reason ? (
                <small style={{ color: "#b91c1c" }}>{fieldErrors.reason}</small>
              ) : null}
            </label>
          </div>
        </div>
      );
    }

    if (panelMode === "review") {
      return (
        <div style={cardStyles.section}>
          <div style={cardStyles.sectionHeader}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 15 }}>
                Duyệt / Từ chối
              </div>
              <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
                Chỉ hiển thị cho role được phép.
              </div>
            </div>
          </div>
          <div style={cardStyles.sectionBody}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 12 }}>
                Nhận xét tùy chọn
              </span>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Nhập comment nếu cần"
                style={textareaStyle}
              />
            </label>
          </div>
        </div>
      );
    }

    return renderRequestOverview();
  };

  const renderFooterActions = () => {
    if (canReview) {
      return (
        <>
          <button
            type="button"
            style={actionButtonPrimary}
            onClick={() => void submitReview("Approve")}
            disabled={saving || !selectedRequestId || !canReviewSelected}
          >
            <CheckCircle size={14} /> Duyệt
          </button>
          <button
            type="button"
            style={actionButtonDanger}
            onClick={() => void submitReview("Reject")}
            disabled={saving || !selectedRequestId || !canReviewSelected}
          >
            <AlertCircle size={14} /> Từ chối
          </button>
          <button type="button" style={actionButtonGhost} onClick={onClose}>
            Đóng
          </button>
        </>
      );
    }

    if (panelMode === "create") {
      return (
        <>
          <button
            type="button"
            style={actionButtonGhost}
            onClick={() => setPanelMode("detail")}
            disabled={saving || loadingForm}
          >
            Hủy
          </button>
          <button
            type="button"
            style={actionButtonPrimary}
            onClick={() => void submitCreate()}
            disabled={saving || loadingForm || !canCreateNew}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}{" "}
            Tạo mới
          </button>
          <button type="button" style={actionButtonGhost} onClick={onClose}>
            Đóng
          </button>
        </>
      );
    }

    if (panelMode === "edit") {
      return (
        <>
          <button
            type="button"
            style={actionButtonGhost}
            onClick={() => setPanelMode("detail")}
            disabled={saving}
          >
            Hủy
          </button>
          <button
            type="button"
            style={actionButtonPrimary}
            onClick={() => void submitEdit()}
            disabled={saving || loadingForm || !hasActiveRequest}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Edit size={14} />
            )}{" "}
            Cập nhật
          </button>
          <button type="button" style={actionButtonGhost} onClick={onClose}>
            Đóng
          </button>
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          style={actionButtonGhost}
          onClick={() => void openCreate()}
          disabled={loadingForm || saving || !canCreateNew}
        >
          <Plus size={14} /> Tạo mới
        </button>
        {canModifySelected ? (
          <>
            <button
              type="button"
              style={actionButtonPrimary}
              onClick={() => void openEdit(activeRequestId)}
              disabled={
                saving || loadingForm || !hasActiveRequest || !canEditSelected
              }
            >
              <Edit size={14} /> Sửa
            </button>
            {canDeleteSelected ? (
              <button
                type="button"
                style={actionButtonDanger}
                onClick={() => {
                  if (!hasActiveRequest) return;
                  setIsDeleteConfirmOpen(true);
                }}
                disabled={saving || loadingForm || !hasActiveRequest}
              >
                <Trash2 size={14} /> Xóa
              </button>
            ) : null}
          </>
        ) : null}
        <button type="button" style={actionButtonGhost} onClick={onClose}>
          Đóng
        </button>
      </>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div style={modalStyles.overlay} role="dialog" aria-modal="true">
      <div style={modalStyles.card}>
        <div style={modalStyles.header}>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
                Đơn xin đổi đề tài
              </div>
              <span
                style={{
                  borderRadius: 999,
                  padding: "6px 10px",
                  background: statusColors.bg,
                  color: statusColors.text,
                  border: `1px solid ${statusColors.border}`,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {selectedRequest?.status || "Unknown"}
              </span>
            </div>
            <div style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
              {selectedRequest?.requestCode
                ? `Mã request: ${selectedRequest.requestCode}`
                : "Danh sách và chi tiết workflow đổi tên đề tài"}
              {selectedRequest?.createdAt
                ? ` • Tạo lúc: ${selectedRequest.createdAt}`
                : ""}
            </div>
          </div>

          <button type="button" style={actionButtonGhost} onClick={onClose}>
            <X size={16} /> Đóng
          </button>
        </div>

        {(bannerError || accessDenied) && (
          <div
            style={{
              margin: "12px 16px 0",
              borderRadius: 12,
              padding: 12,
              background: accessDenied ? "#fff7ed" : "#fef2f2",
              border: `1px solid ${accessDenied ? "#fdba74" : "#fecaca"}`,
              color: accessDenied ? "#9a3412" : "#b91c1c",
              fontSize: 13,
            }}
          >
            {accessDenied || bannerError}
          </div>
        )}

        <div style={modalStyles.body}>
          <main style={modalStyles.main}>
            {loadingDetail && panelMode === "detail" ? (
              <div style={cardStyles.section}>
                <div
                  style={{
                    padding: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#64748b",
                  }}
                >
                  <Loader2 size={16} className="animate-spin" /> Đang tải chi
                  tiết...
                </div>
              </div>
            ) : null}

            {panelMode === "detail" ||
            panelMode === "edit" ||
            panelMode === "review"
              ? renderRequestOverview()
              : null}
            {panelMode === "create" || panelMode === "review"
              ? renderForm()
              : null}

            {!selectedRequest && panelMode === "detail" ? (
              <div style={cardStyles.section}>
                <div style={{ padding: 18, color: "#64748b" }}>
                  Chưa có request nào cho đề tài này. Dùng nút Tạo mới ở thanh
                  tiêu đề của card request.
                </div>
              </div>
            ) : null}
          </main>
        </div>

        {!canReview && panelMode !== "detail" ? (
          <div style={modalStyles.footer}>
            <div style={{ color: "#475569", fontSize: 13 }}>
              {loadingList ? "Đang tải dữ liệu request..." : null}
              {selectedRequest
                ? `Đang xem ${selectedRequest.requestCode || `#${selectedRequest.topicRenameRequestID}`}`
                : defaultTopicTitle
                  ? `Mở theo đề tài: ${defaultTopicTitle}`
                  : "Chưa có request"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {renderFooterActions()}
            </div>
          </div>
        ) : null}

        {isDeleteConfirmOpen ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 140,
              background: "rgba(15, 23, 42, 0.58)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            role="dialog"
            aria-modal="true"
            onClick={() => {
              setIsDeleteConfirmOpen(false);
            }}
          >
            <div
              style={{
                width: "min(520px, 100%)",
                borderRadius: 18,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 24px 80px rgba(15, 23, 42, 0.32)",
                padding: 20,
                display: "grid",
                gap: 14,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div
                  style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}
                >
                  Xác nhận xóa
                </div>
                <div
                  style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}
                >
                  Bạn có chắc muốn xóa đơn xin đổi đề tài này không? Hành động
                  này không thể hoàn tác.
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  style={actionButtonGhost}
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                  }}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  style={actionButtonDanger}
                  onClick={() => void submitDelete()}
                  disabled={saving || !hasActiveRequest}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}{" "}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TopicRenameRequestModal;
