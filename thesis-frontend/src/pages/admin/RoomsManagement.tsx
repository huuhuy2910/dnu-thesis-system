import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Download,
  Eye,
  Pencil,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { fetchData, FetchDataError } from "../../api/fetchData";
import { getAccessToken } from "../../services/auth-session.service";
import { useToast } from "../../context/useToast";
import type { ApiResponse } from "../../types/api";
import {
  pickCaseInsensitiveValue,
  readEnvelopeAllowedActions,
  readEnvelopeData,
  readEnvelopeErrorMessages,
  readEnvelopeMessage,
  readEnvelopeSuccess,
  readEnvelopeTotalCount,
  readEnvelopeWarningMessages,
} from "../../utils/api-envelope";
import "./Dashboard.css";

type RoomStatusLabel = "Đang hoạt động" | "Bảo trì" | "Ngưng sử dụng";

type RoomRecord = Record<string, unknown>;

interface RoomRow {
  roomID: number;
  roomCode: string;
  status: string;
  createdAt: string;
  lastUpdated: string;
}

interface RoomStatusSummaryItem {
  status: string;
  count: number;
}

interface RoomUsageRow {
  committeeID: number | null;
  committeeCode: string;
  committeeName: string;
  defenseTermId: number | null;
  defenseDate: string;
  status: string;
}

interface RoomImportRow {
  rowNumber: number;
  roomCode: string;
  status: string;
  result: string;
  message: string;
}

interface RoomImportResult {
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  rows: RoomImportRow[];
}

interface RoomFormState {
  roomCode: string;
  status: string;
}

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const statusStyleByLabel: Record<RoomStatusLabel, { bg: string; text: string }> = {
  "Đang hoạt động": { bg: "#dcfce7", text: "#166534" },
  "Bảo trì": { bg: "#fef3c7", text: "#b45309" },
  "Ngưng sử dụng": { bg: "#fee2e2", text: "#b91c1c" },
};

function asString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  const next = String(value).trim();
  return next || fallback;
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function formatDateTime(value: unknown): string {
  const raw = asString(value);
  if (!raw) {
    return "-";
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleString("vi-VN");
}

function normalizeStatusLabel(value: unknown): string {
  const raw = asString(value);
  if (!raw) {
    return "Đang hoạt động";
  }

  const normalized = raw.toLowerCase();
  if (
    normalized === "active" ||
    normalized === "available" ||
    normalized.includes("đang hoạt")
  ) {
    return "Đang hoạt động";
  }

  if (normalized === "maintenance" || normalized.includes("bảo trì")) {
    return "Bảo trì";
  }

  if (
    normalized === "inactive" ||
    normalized === "disabled" ||
    normalized.includes("ngưng")
  ) {
    return "Ngưng sử dụng";
  }

  return raw;
}

function toStatusChipStyle(status: string): { bg: string; text: string } {
  const normalized = normalizeStatusLabel(status) as RoomStatusLabel;
  if (statusStyleByLabel[normalized]) {
    return statusStyleByLabel[normalized];
  }
  return { bg: "#e2e8f0", text: "#334155" };
}

function parseRoom(item: RoomRecord): RoomRow | null {
  const roomID = asNumber(
    pickCaseInsensitiveValue(item, ["roomID", "roomId", "id"], null),
  );
  const roomCode = asString(
    pickCaseInsensitiveValue(item, ["roomCode", "code"], ""),
  ).toUpperCase();

  if (!roomID || !roomCode) {
    return null;
  }

  return {
    roomID,
    roomCode,
    status: normalizeStatusLabel(
      pickCaseInsensitiveValue(item, ["status", "roomStatus"], "Đang hoạt động"),
    ),
    createdAt: formatDateTime(
      pickCaseInsensitiveValue(item, ["createdAt", "createdDate"], ""),
    ),
    lastUpdated: formatDateTime(
      pickCaseInsensitiveValue(item, ["lastUpdated", "updatedAt", "lastModified"], ""),
    ),
  };
}

function parseRoomList(payload: unknown): RoomRow[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is RoomRecord => Boolean(item && typeof item === "object"))
    .map(parseRoom)
    .filter((item): item is RoomRow => Boolean(item))
    .sort((left, right) => left.roomCode.localeCompare(right.roomCode, "vi"));
}

function parseStatusSummary(payload: unknown): RoomStatusSummaryItem[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is RoomRecord => Boolean(item && typeof item === "object"))
    .map((item) => ({
      status: normalizeStatusLabel(pickCaseInsensitiveValue(item, ["status"], "")),
      count: asNumber(pickCaseInsensitiveValue(item, ["count"], 0)) ?? 0,
    }))
    .filter((item) => item.status.length > 0);
}

function parseUsageRows(payload: unknown): RoomUsageRow[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is RoomRecord => Boolean(item && typeof item === "object"))
    .map((item) => ({
      committeeID: asNumber(pickCaseInsensitiveValue(item, ["committeeID", "committeeId"], null)),
      committeeCode: asString(
        pickCaseInsensitiveValue(item, ["committeeCode", "councilCode"], "-"),
      ),
      committeeName: asString(
        pickCaseInsensitiveValue(item, ["committeeName", "councilName"], "-"),
      ),
      defenseTermId: asNumber(
        pickCaseInsensitiveValue(item, ["defenseTermId", "periodId"], null),
      ),
      defenseDate: formatDateTime(
        pickCaseInsensitiveValue(item, ["defenseDate", "date"], ""),
      ),
      status: asString(pickCaseInsensitiveValue(item, ["status"], "-")),
    }));
}

function parseImportResult(payload: unknown): RoomImportResult | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as RoomRecord;
  const rowsRaw = pickCaseInsensitiveValue<unknown>(source, ["rows"], []);
  const rows = Array.isArray(rowsRaw)
    ? rowsRaw
        .filter((item): item is RoomRecord => Boolean(item && typeof item === "object"))
        .map((item) => ({
          rowNumber: asNumber(pickCaseInsensitiveValue(item, ["rowNumber"], 0)) ?? 0,
          roomCode: asString(pickCaseInsensitiveValue(item, ["roomCode"], "-")),
          status: normalizeStatusLabel(
            pickCaseInsensitiveValue(item, ["status"], "Đang hoạt động"),
          ),
          result: asString(pickCaseInsensitiveValue(item, ["result"], "")),
          message: asString(pickCaseInsensitiveValue(item, ["message"], "")),
        }))
    : [];

  return {
    totalRows: asNumber(pickCaseInsensitiveValue(source, ["totalRows"], 0)) ?? 0,
    createdCount: asNumber(pickCaseInsensitiveValue(source, ["createdCount"], 0)) ?? 0,
    updatedCount: asNumber(pickCaseInsensitiveValue(source, ["updatedCount"], 0)) ?? 0,
    failedCount: asNumber(pickCaseInsensitiveValue(source, ["failedCount"], 0)) ?? 0,
    rows,
  };
}

function extractFileNameFromDisposition(headerValue: string | null): string | null {
  if (!headerValue) {
    return null;
  }

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const defaultMatch = headerValue.match(/filename="?([^";]+)"?/i);
  if (defaultMatch && defaultMatch[1]) {
    return defaultMatch[1];
  }

  return null;
}

function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5180")
    .toString()
    .trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withScheme.endsWith("/") ? withScheme.slice(0, -1) : withScheme;
}

async function readRawErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as ApiResponse<unknown>;
      const errors = readEnvelopeErrorMessages(payload);
      if (errors.length > 0) {
        return errors[0];
      }

      const message = readEnvelopeMessage(payload);
      if (message) {
        return message;
      }
    } else {
      const text = (await response.text()).trim();
      if (text) {
        return text;
      }
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

function actionColor(result: string): string {
  const normalized = result.toLowerCase();
  if (normalized.includes("create")) {
    return "#166534";
  }
  if (normalized.includes("update")) {
    return "#1d4ed8";
  }
  return "#b91c1c";
}

function cycleStatus(currentStatus: string): string {
  const normalized = normalizeStatusLabel(currentStatus);
  if (normalized === "Đang hoạt động") {
    return "Bảo trì";
  }
  if (normalized === "Bảo trì") {
    return "Ngưng sử dụng";
  }
  return "Đang hoạt động";
}

const RoomsManagement: React.FC = () => {
  const { addToast } = useToast();

  const notifyError = useCallback((message: string) => addToast(message, "error"), [addToast]);
  const notifySuccess = useCallback((message: string) => addToast(message, "success"), [addToast]);
  const notifyWarning = useCallback((message: string) => addToast(message, "warning"), [addToast]);
  const notifyInfo = useCallback((message: string) => addToast(message, "info"), [addToast]);

  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [statusSummary, setStatusSummary] = useState<RoomStatusSummaryItem[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [allowedActions, setAllowedActions] = useState<string[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [formState, setFormState] = useState<RoomFormState>({
    roomCode: "",
    status: "Đang hoạt động",
  });
  const [isSavingRoom, setIsSavingRoom] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailRoom, setDetailRoom] = useState<RoomRow | null>(null);

  const [showUsagePanel, setShowUsagePanel] = useState(false);
  const [usageRoomCode, setUsageRoomCode] = useState("");
  const [usageDate, setUsageDate] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  });
  const [usagePeriodId, setUsagePeriodId] = useState("");
  const [usageRows, setUsageRows] = useState<RoomUsageRow[]>([]);
  const [usageTotalCount, setUsageTotalCount] = useState(0);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [upsertMode, setUpsertMode] = useState(true);
  const [importResult, setImportResult] = useState<RoomImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const applyEnvelopeMeta = useCallback(
    (response: ApiResponse<unknown>) => {
      const warnings = readEnvelopeWarningMessages(response);
      if (warnings.length > 0) {
        notifyWarning(warnings.join(" | "));
      }

      const actions = readEnvelopeAllowedActions(response)
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
      if (actions.length > 0) {
        setAllowedActions((prev) => Array.from(new Set([...prev, ...actions])));
      }
    },
    [notifyWarning],
  );

  const readApiErrorMessage = useCallback(
    (error: unknown, fallbackMessage: string, conflictMessage?: string) => {
      if (error instanceof FetchDataError) {
        if (error.status === 409 && conflictMessage) {
          return conflictMessage;
        }

        const envelope = error.data as ApiResponse<unknown> | null | undefined;
        if (envelope) {
          const messages = readEnvelopeErrorMessages(envelope);
          if (messages.length > 0) {
            return messages[0];
          }

          const message = readEnvelopeMessage(envelope);
          if (message) {
            return message;
          }
        }
      }

      if (error instanceof Error && error.message.trim()) {
        return error.message.trim();
      }

      return fallbackMessage;
    },
    [],
  );

  const loadRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    setListError(null);

    try {
      const params = new URLSearchParams();
      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const response = await fetchData<ApiResponse<unknown>>(
        `/rooms/get-list?${params.toString()}`,
        { method: "GET" },
      );

      applyEnvelopeMeta(response);

      if (!readEnvelopeSuccess(response)) {
        const errors = readEnvelopeErrorMessages(response);
        const message = readEnvelopeMessage(response) ?? "Không tải được danh sách phòng.";
        throw new Error(errors[0] || message);
      }

      const payload = readEnvelopeData<unknown>(response);
      const nextRows = parseRoomList(payload);
      setRooms(nextRows);

      const countFromEnvelope = readEnvelopeTotalCount(response);
      setTotalCount(countFromEnvelope > 0 ? countFromEnvelope : nextRows.length);
    } catch (error) {
      const message = readApiErrorMessage(error, "Không tải được danh sách phòng.");
      setListError(message);
      notifyError(message);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [applyEnvelopeMeta, keyword, notifyError, page, pageSize, readApiErrorMessage]);

  const loadStatusSummary = useCallback(async () => {
    setIsLoadingSummary(true);

    try {
      const response = await fetchData<ApiResponse<unknown>>("/rooms/status-summary", {
        method: "GET",
      });

      applyEnvelopeMeta(response);

      if (!readEnvelopeSuccess(response)) {
        const errors = readEnvelopeErrorMessages(response);
        const message = readEnvelopeMessage(response) ?? "Không tải được thống kê trạng thái.";
        throw new Error(errors[0] || message);
      }

      const payload = readEnvelopeData<unknown>(response);
      setStatusSummary(parseStatusSummary(payload));
    } catch (error) {
      notifyError(readApiErrorMessage(error, "Không tải được thống kê trạng thái phòng."));
    } finally {
      setIsLoadingSummary(false);
    }
  }, [applyEnvelopeMeta, notifyError, readApiErrorMessage]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    void loadStatusSummary();
  }, [loadStatusSummary]);

  const filteredRooms = useMemo(() => {
    if (statusFilter === "all") {
      return rooms;
    }

    return rooms.filter(
      (item) => normalizeStatusLabel(item.status) === normalizeStatusLabel(statusFilter),
    );
  }, [rooms, statusFilter]);

  const totalPages = useMemo(() => {
    const safeTotal = totalCount > 0 ? totalCount : rooms.length;
    const nextPages = Math.ceil(safeTotal / Math.max(1, pageSize));
    return Math.max(1, nextPages);
  }, [pageSize, rooms.length, totalCount]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const stats = useMemo(() => {
    const summaryMap = new Map<string, number>();
    statusSummary.forEach((item) => {
      summaryMap.set(normalizeStatusLabel(item.status), item.count);
    });

    const totalFromSummary = statusSummary.reduce((acc, item) => acc + item.count, 0);

    return {
      total: totalFromSummary > 0 ? totalFromSummary : totalCount,
      active:
        summaryMap.get("Đang hoạt động") ??
        rooms.filter((item) => normalizeStatusLabel(item.status) === "Đang hoạt động").length,
      maintenance:
        summaryMap.get("Bảo trì") ??
        rooms.filter((item) => normalizeStatusLabel(item.status) === "Bảo trì").length,
      inactive:
        summaryMap.get("Ngưng sử dụng") ??
        rooms.filter((item) => normalizeStatusLabel(item.status) === "Ngưng sử dụng").length,
    };
  }, [rooms, statusSummary, totalCount]);

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("all");
    setPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
  };

  const openCreateModal = () => {
    setEditingRoomId(null);
    setFormState({ roomCode: "", status: "Đang hoạt động" });
    setShowForm(true);
  };

  const openEditModal = (room: RoomRow) => {
    setEditingRoomId(room.roomID);
    setFormState({ roomCode: room.roomCode, status: room.status });
    setShowForm(true);
  };

  const openDetailModal = async (room: RoomRow) => {
    setShowDetailModal(true);
    setDetailRoom(room);
    setIsLoadingDetail(true);

    try {
      const response = await fetchData<ApiResponse<unknown>>(
        `/rooms/get-detail/${room.roomID}`,
        {
          method: "GET",
        },
      );

      applyEnvelopeMeta(response);

      if (!readEnvelopeSuccess(response)) {
        const errors = readEnvelopeErrorMessages(response);
        const message = readEnvelopeMessage(response) ?? "Không tải được chi tiết phòng.";
        throw new Error(errors[0] || message);
      }

      const payload = readEnvelopeData<unknown>(response);
      if (payload && typeof payload === "object") {
        const mapped = parseRoom(payload as RoomRecord);
        if (mapped) {
          setDetailRoom(mapped);
        }
      }
    } catch (error) {
      notifyError(readApiErrorMessage(error, "Không tải được chi tiết phòng."));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const saveRoom = async () => {
    const roomCode = formState.roomCode.trim().toUpperCase();
    const status = formState.status.trim();

    if (!roomCode) {
      notifyWarning("RoomCode là bắt buộc.");
      return;
    }

    if (roomCode.length > 40) {
      notifyWarning("RoomCode tối đa 40 ký tự.");
      return;
    }

    if (status.length > 50) {
      notifyWarning("Status tối đa 50 ký tự.");
      return;
    }

    setIsSavingRoom(true);

    try {
      const body = {
        roomCode,
        ...(status ? { status } : {}),
      };

      const response = editingRoomId
        ? await fetchData<ApiResponse<unknown>>(`/rooms/update/${editingRoomId}`, {
            method: "PUT",
            body,
          })
        : await fetchData<ApiResponse<unknown>>("/rooms/create", {
            method: "POST",
            body,
          });

      applyEnvelopeMeta(response);

      if (!readEnvelopeSuccess(response)) {
        const errors = readEnvelopeErrorMessages(response);
        const message = readEnvelopeMessage(response) ?? "Không lưu được phòng.";
        throw new Error(errors[0] || message);
      }

      notifySuccess(editingRoomId ? "Cập nhật phòng thành công." : "Tạo phòng thành công.");
      setShowForm(false);
      setEditingRoomId(null);
      setFormState({ roomCode: "", status: "Đang hoạt động" });
      await Promise.all([loadRooms(), loadStatusSummary()]);
    } catch (error) {
      notifyError(
        readApiErrorMessage(
          error,
          editingRoomId ? "Không cập nhật được phòng." : "Không tạo được phòng.",
        ),
      );
    } finally {
      setIsSavingRoom(false);
    }
  };

  const updateRoomStatus = async (room: RoomRow) => {
    setIsSavingRoom(true);

    try {
      const nextStatus = cycleStatus(room.status);

      const response = await fetchData<ApiResponse<unknown>>(
        `/rooms/update-status/${room.roomID}`,
        {
          method: "PATCH",
          body: { status: nextStatus },
        },
      );

      applyEnvelopeMeta(response);

      if (!readEnvelopeSuccess(response)) {
        const errors = readEnvelopeErrorMessages(response);
        const message = readEnvelopeMessage(response) ?? "Không cập nhật được trạng thái phòng.";
        throw new Error(errors[0] || message);
      }

      notifySuccess("Cập nhật trạng thái phòng thành công.");
      await Promise.all([loadRooms(), loadStatusSummary()]);
    } catch (error) {
      notifyError(readApiErrorMessage(error, "Không cập nhật được trạng thái phòng."));
    } finally {
      setIsSavingRoom(false);
    }
  };

  const deleteRoom = async (room: RoomRow) => {
    if (!window.confirm(`Xóa phòng ${room.roomCode}?`)) {
      return;
    }

    setIsSavingRoom(true);

    try {
      const response = await fetchData<ApiResponse<unknown>>(
        `/rooms/delete/${room.roomID}`,
        {
          method: "DELETE",
        },
      );

      applyEnvelopeMeta(response);

      if (!readEnvelopeSuccess(response)) {
        const errors = readEnvelopeErrorMessages(response);
        const message = readEnvelopeMessage(response) ?? "Không xóa được phòng.";
        throw new Error(errors[0] || message);
      }

      notifySuccess("Xóa phòng thành công.");
      await Promise.all([loadRooms(), loadStatusSummary()]);
    } catch (error) {
      notifyError(
        readApiErrorMessage(
          error,
          "Không xóa được phòng.",
          "Không thể xóa phòng vì phòng đang được hội đồng tham chiếu.",
        ),
      );
    } finally {
      setIsSavingRoom(false);
    }
  };

  const loadUsageByDate = async () => {
    setIsLoadingUsage(true);

    try {
      const params = new URLSearchParams();
      if (usageRoomCode.trim()) {
        params.set("roomCode", usageRoomCode.trim().toUpperCase());
      }
      if (usageDate.trim()) {
        params.set("date", usageDate.trim());
      }
      if (usagePeriodId.trim()) {
        const parsed = Number(usagePeriodId.trim());
        if (Number.isFinite(parsed) && parsed > 0) {
          params.set("periodId", String(Math.floor(parsed)));
        }
      }

      const query = params.toString();
      const response = await fetchData<ApiResponse<unknown>>(
        `/rooms/usage-by-date${query ? `?${query}` : ""}`,
        {
          method: "GET",
        },
      );

      applyEnvelopeMeta(response);

      if (!readEnvelopeSuccess(response)) {
        const errors = readEnvelopeErrorMessages(response);
        const message = readEnvelopeMessage(response) ?? "Không tải được usage-by-date.";
        throw new Error(errors[0] || message);
      }

      const payload = readEnvelopeData<unknown>(response);
      const rows = parseUsageRows(payload);
      setUsageRows(rows);

      const countFromEnvelope = readEnvelopeTotalCount(response);
      setUsageTotalCount(countFromEnvelope > 0 ? countFromEnvelope : rows.length);
    } catch (error) {
      setUsageRows([]);
      setUsageTotalCount(0);
      notifyError(readApiErrorMessage(error, "Không tải được usage-by-date."));
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const importRooms = async () => {
    if (!importFile) {
      notifyWarning("Vui lòng chọn file .xlsx để import.");
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const response = await fetchData<ApiResponse<unknown>>(
        `/rooms/import?upsert=${upsertMode ? "true" : "false"}`,
        {
          method: "POST",
          body: formData,
        },
      );

      applyEnvelopeMeta(response);

      if (!readEnvelopeSuccess(response)) {
        const errors = readEnvelopeErrorMessages(response);
        const message = readEnvelopeMessage(response) ?? "Import phòng thất bại.";
        throw new Error(errors[0] || message);
      }

      const payload = readEnvelopeData<unknown>(response);
      const mappedResult = parseImportResult(payload);
      setImportResult(mappedResult);

      if (mappedResult) {
        notifySuccess(
          `Import hoàn tất: ${mappedResult.createdCount} tạo mới, ${mappedResult.updatedCount} cập nhật, ${mappedResult.failedCount} lỗi.`,
        );
      } else {
        notifySuccess("Import phòng thành công.");
      }

      await Promise.all([loadRooms(), loadStatusSummary()]);
    } catch (error) {
      notifyError(readApiErrorMessage(error, "Import phòng thất bại."));
    } finally {
      setIsImporting(false);
    }
  };

  const exportRooms = async () => {
    setIsExporting(true);

    try {
      const accessToken = getAccessToken();
      const headers = new Headers();
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }

      const response = await fetch(`${resolveApiBase()}/api/rooms/export`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const message = await readRawErrorMessage(response, "Không export được danh sách phòng.");
        throw new Error(message);
      }

      const blob = await response.blob();
      const fileName =
        extractFileNameFromDisposition(response.headers.get("content-disposition")) ??
        `rooms-${new Date().toISOString().slice(0, 10)}.xlsx`;

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);

      notifySuccess("Export file phòng thành công.");
    } catch (error) {
      notifyError(readApiErrorMessage(error, "Không export được danh sách phòng."));
    } finally {
      setIsExporting(false);
    }
  };

  const onKeywordChange = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const onPageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const statusFilterOptions = useMemo(() => {
    const names = new Set<string>(["Đang hoạt động", "Bảo trì", "Ngưng sử dụng"]);
    statusSummary.forEach((item) => names.add(normalizeStatusLabel(item.status)));
    return ["all", ...Array.from(names)];
  }, [statusSummary]);

  return (
    <div
      style={{
        maxWidth: 1360,
        margin: "0 auto",
        padding: 20,
        fontFamily: '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif',
        color: "#0f172a",
      }}
    >
      <style>
        {`
          .rooms-module {
            display: grid;
            gap: 16px;
          }
          .rooms-header,
          .rooms-panel,
          .rooms-table-shell,
          .rooms-import,
          .rooms-modal {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
          }
          .rooms-header {
            padding: 18px 20px;
          }
          .rooms-header h1 {
            margin: 0;
            font-size: 30px;
            line-height: 1.15;
            letter-spacing: -0.03em;
            color: #002855;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 800;
          }
          .rooms-header p {
            margin: 8px 0 0;
            color: #475569;
            max-width: 70ch;
            font-size: 13px;
          }
          .rooms-stats {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }
          .rooms-stat {
            padding: 12px;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
          }
          .rooms-stat-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            font-weight: 700;
          }
          .rooms-stat-value {
            margin-top: 4px;
            font-size: 24px;
            line-height: 1.1;
            font-weight: 800;
            color: #0f172a;
          }
          .rooms-stat-value.active { color: #166534; }
          .rooms-stat-value.maintenance { color: #b45309; }
          .rooms-stat-value.inactive { color: #b91c1c; }
          .rooms-toolbar {
            display: grid;
            grid-template-columns: minmax(0, 1.4fr) minmax(180px, 0.6fr) minmax(100px, 0.3fr) auto;
            gap: 10px;
            align-items: center;
          }
          .rooms-search {
            position: relative;
          }
          .rooms-search svg {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #64748b;
          }
          .rooms-search input,
          .rooms-toolbar select,
          .rooms-toolbar input,
          .rooms-modal input,
          .rooms-modal select,
          .rooms-import input[type="file"] {
            width: 100%;
            min-width: 0;
            height: 42px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            color: #0f172a;
            padding: 0 12px 0 38px;
            font-size: 14px;
          }
          .rooms-toolbar select,
          .rooms-toolbar input,
          .rooms-modal select,
          .rooms-modal input,
          .rooms-import input[type="file"] {
            padding-left: 12px;
          }
          .rooms-search input:focus,
          .rooms-toolbar select:focus,
          .rooms-toolbar input:focus,
          .rooms-modal input:focus,
          .rooms-modal select:focus {
            outline: none;
            border-color: #f97316;
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
          }
          .rooms-actions,
          .rooms-table-actions,
          .rooms-modal-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .rooms-btn {
            min-height: 42px;
            padding: 0 14px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #0f172a;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            cursor: pointer;
            font-weight: 600;
            line-height: 1.15;
            transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
          }
          .rooms-btn:hover:not(:disabled) {
            border-color: #94a3b8;
            background: #f8fafc;
            transform: translateY(-1px);
          }
          .rooms-btn.primary {
            border-color: #ea580c;
            background: #f97316;
            color: #ffffff;
          }
          .rooms-btn.primary:hover:not(:disabled) {
            border-color: #ea580c;
            background: #ea580c;
          }
          .rooms-btn.danger {
            border-color: #fecaca;
            background: #fef2f2;
            color: #b91c1c;
          }
          .rooms-btn.danger:hover:not(:disabled) {
            border-color: #fca5a5;
            background: #fee2e2;
          }
          .rooms-btn:disabled {
            opacity: .6;
            cursor: not-allowed;
            transform: none;
          }
          .rooms-table-shell {
            overflow: hidden;
          }
          .rooms-table-head {
            padding: 14px 16px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .rooms-table-head strong {
            font-size: 14px;
            color: #0f172a;
          }
          .rooms-table-wrap {
            overflow: auto;
          }
          .rooms-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .rooms-table thead {
            background: #f8fafc;
          }
          .rooms-table th {
            padding: 12px 14px;
            text-align: left;
            color: #475569;
            font-size: 12px;
            font-weight: 700;
            border-bottom: 1px solid #e5e7eb;
            white-space: nowrap;
          }
          .rooms-table td {
            padding: 12px 14px;
            border-bottom: 1px solid #eef2f7;
            vertical-align: middle;
          }
          .rooms-table tbody tr:hover {
            background: #f8fafc;
          }
          .rooms-badge {
            display: inline-flex;
            align-items: center;
            min-height: 28px;
            padding: 0 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
          }
          .rooms-import {
            padding: 14px;
          }
          .rooms-import h3,
          .rooms-modal h3 {
            margin: 0 0 10px;
            color: #002855;
            font-size: 18px;
            line-height: 1.2;
          }
          .rooms-import-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 10px;
          }
          .rooms-import-row label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #334155;
            font-size: 13px;
          }
          .rooms-import-results {
            margin-top: 10px;
            overflow: auto;
          }
          .rooms-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            background: rgba(15, 23, 42, 0.42);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
          }
          .rooms-modal {
            width: min(540px, 100%);
            padding: 16px;
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
          }
          .rooms-field {
            display: grid;
            gap: 6px;
          }
          .rooms-field span {
            font-size: 13px;
            font-weight: 600;
            color: #334155;
          }
          .rooms-inline-alert {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 14px;
            border-radius: 10px;
            border: 1px solid #fda4af;
            background: #fff1f2;
            color: #9f1239;
            margin-top: 12px;
          }
          .rooms-inline-alert strong {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .rooms-usage-toolbar {
            display: grid;
            grid-template-columns: minmax(130px, 0.8fr) minmax(140px, 1fr) minmax(120px, 0.8fr) auto;
            gap: 10px;
            align-items: center;
          }
          .rooms-usage-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
           }
           .rooms-usage-note {
             margin: 0 0 10px;
             font-size: 12px;
             color: #64748b;
           }
           .rooms-loading-state,
           .rooms-empty-state {
             padding: 18px;
             text-align: center;
             color: #64748b;
           }
          .rooms-pagination {
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            border-top: 1px solid #e5e7eb;
            background: #ffffff;
          }
          .rooms-pagination-info {
            font-size: 12px;
            color: #64748b;
          }
          .rooms-meta-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
          }
          .rooms-meta-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border-radius: 999px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            color: #334155;
            font-size: 12px;
            padding: 5px 10px;
          }
           @media (max-width: 980px) {
             .rooms-stats {
               grid-template-columns: repeat(2, minmax(0, 1fr));
             }
             .rooms-toolbar {
               grid-template-columns: 1fr;
             }
            .rooms-usage-toolbar {
              grid-template-columns: 1fr;
            }
             .rooms-actions,
             .rooms-table-actions {
               justify-content: flex-start;
             }
           }
           @media (max-width: 640px) {
             .rooms-header h1 {
               font-size: 24px;
             }
             .rooms-stats {
               grid-template-columns: 1fr;
             }
           }
         `}
       </style>

      <div className="rooms-module">
        <section className="rooms-header">
          <h1>
            <Building2 size={28} color="#f97316" /> Quản lý phòng
          </h1>
          <p>
            Tích hợp theo chuẩn RoomsController: get-list/get-detail/create/update/update-status/status-summary/usage-by-date/export/import/delete.
          </p>
          <div className="rooms-meta-row">
            <span className="rooms-meta-chip">
              <PieChart size={13} /> TotalCount: {totalCount}
            </span>
            <span className="rooms-meta-chip">
              AllowedActions: {allowedActions.length > 0 ? allowedActions.join(", ") : "-"}
            </span>
          </div>
        </section>

        <section className="rooms-stats">
          <div className="rooms-stat">
            <div className="rooms-stat-label">Tổng số phòng</div>
            <div className="rooms-stat-value">{stats.total}</div>
          </div>
          <div className="rooms-stat">
            <div className="rooms-stat-label">Đang hoạt động</div>
            <div className="rooms-stat-value active">{stats.active}</div>
          </div>
          <div className="rooms-stat">
            <div className="rooms-stat-label">Bảo trì</div>
            <div className="rooms-stat-value maintenance">{stats.maintenance}</div>
          </div>
          <div className="rooms-stat">
            <div className="rooms-stat-label">Ngưng sử dụng</div>
            <div className="rooms-stat-value inactive">{stats.inactive}</div>
          </div>
        </section>

        <section className="rooms-panel" style={{ padding: 14 }}>
          <div className="rooms-toolbar">
            <div className="rooms-search">
              <Search size={16} />
              <input
                value={keyword}
                onChange={(event) => onKeywordChange(event.target.value)}
                placeholder="Tìm theo RoomCode"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {statusFilterOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Tất cả trạng thái" : item}
                </option>
              ))}
            </select>

            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}/trang
                </option>
              ))}
            </select>

            <div className="rooms-actions">
              <button
                type="button"
                className="rooms-btn"
                onClick={() => {
                  resetFilters();
                  void Promise.all([loadRooms(), loadStatusSummary()]);
                }}
                disabled={isLoadingRooms || isLoadingSummary}
              >
                <RefreshCw size={14} /> Làm mới
              </button>

              <button
                type="button"
                className="rooms-btn primary"
                onClick={openCreateModal}
                disabled={isSavingRoom}
              >
                <Plus size={14} /> Tạo mới
              </button>

              <button
                type="button"
                className="rooms-btn"
                onClick={() => {
                  setShowUsagePanel((prev) => !prev);
                  if (!showUsagePanel) {
                    notifyInfo("Có thể lọc usage theo roomCode/date/periodId.");
                  }
                }}
              >
                <CalendarDays size={14} /> Usage-by-date
              </button>
            </div>
          </div>

          {listError && (
            <div className="rooms-inline-alert">
              <strong>
                <AlertTriangle size={14} /> Không tải được dữ liệu phòng
              </strong>
              <span>{listError}</span>
            </div>
          )}
        </section>

        <section className="rooms-table-shell">
          <div className="rooms-table-head">
            <div style={{ display: "grid", gap: 4 }}>
              <strong>Danh sách phòng</strong>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {isLoadingRooms
                  ? "Đang tải dữ liệu từ backend..."
                  : `${filteredRooms.length} phòng hiển thị / ${totalCount} tổng bản ghi`}
              </span>
            </div>
            <div className="rooms-table-actions">
              <button
                type="button"
                className="rooms-btn"
                onClick={() => setShowImportPanel((prev) => !prev)}
              >
                <Upload size={14} /> Import Excel
              </button>
              <button
                type="button"
                className="rooms-btn"
                onClick={() => void exportRooms()}
                disabled={isExporting}
              >
                <Download size={14} /> {isExporting ? "Đang export" : "Export Excel"}
              </button>
              <button
                type="button"
                className="rooms-btn"
                onClick={() => void loadStatusSummary()}
                disabled={isLoadingSummary}
              >
                <PieChart size={14} /> {isLoadingSummary ? "Đang tải" : "Status summary"}
              </button>
            </div>
          </div>

          <div className="rooms-table-wrap">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>RoomID</th>
                  <th>RoomCode</th>
                  <th>Status</th>
                  <th>CreatedAt</th>
                  <th>LastUpdated</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingRooms && (
                  <tr>
                    <td colSpan={6} className="rooms-loading-state">
                      Đang tải danh sách phòng...
                    </td>
                  </tr>
                )}

                {!isLoadingRooms &&
                  filteredRooms.map((room) => {
                    const chip = toStatusChipStyle(room.status);
                    return (
                      <tr key={room.roomID}>
                        <td style={{ fontWeight: 700 }}>#{room.roomID}</td>
                        <td style={{ fontWeight: 700 }}>{room.roomCode}</td>
                        <td>
                          <span
                            className="rooms-badge"
                            style={{ background: chip.bg, color: chip.text }}
                          >
                            {normalizeStatusLabel(room.status)}
                          </span>
                        </td>
                        <td>{room.createdAt}</td>
                        <td>{room.lastUpdated}</td>
                        <td>
                          <div className="rooms-actions" style={{ justifyContent: "flex-start" }}>
                            <button
                              type="button"
                              className="rooms-btn"
                              onClick={() => void openDetailModal(room)}
                              disabled={isSavingRoom}
                            >
                              <Eye size={14} /> Xem
                            </button>
                            <button
                              type="button"
                              className="rooms-btn"
                              onClick={() => openEditModal(room)}
                              disabled={isSavingRoom}
                            >
                              <Pencil size={14} /> Sửa
                            </button>
                            <button
                              type="button"
                              className="rooms-btn"
                              onClick={() => void updateRoomStatus(room)}
                              disabled={isSavingRoom}
                            >
                              Đổi trạng thái
                            </button>
                            <button
                              type="button"
                              className="rooms-btn danger"
                              onClick={() => void deleteRoom(room)}
                              disabled={isSavingRoom}
                            >
                              <Trash2 size={14} /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!isLoadingRooms && filteredRooms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="rooms-empty-state">
                      Không có dữ liệu phòng phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rooms-pagination">
            <span className="rooms-pagination-info">
              Trang {page}/{totalPages}
            </span>
            <div className="rooms-actions" style={{ justifyContent: "flex-start" }}>
              <button
                type="button"
                className="rooms-btn"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || isLoadingRooms}
              >
                Trang trước
              </button>
              <button
                type="button"
                className="rooms-btn"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || isLoadingRooms}
              >
                Trang sau
              </button>
            </div>
          </div>
        </section>

        {showUsagePanel && (
          <section className="rooms-import">
            <h3>Tra cứu usage-by-date</h3>
            <p className="rooms-usage-note">
              Endpoint: /api/rooms/usage-by-date với query tùy chọn roomCode, date, periodId.
            </p>

            <div className="rooms-usage-toolbar">
              <input
                placeholder="RoomCode (optional)"
                value={usageRoomCode}
                onChange={(event) => setUsageRoomCode(event.target.value)}
              />
              <input
                type="date"
                value={usageDate}
                onChange={(event) => setUsageDate(event.target.value)}
              />
              <input
                placeholder="PeriodID (optional)"
                value={usagePeriodId}
                onChange={(event) => setUsagePeriodId(event.target.value)}
              />
              <div className="rooms-usage-actions">
                <button
                  type="button"
                  className="rooms-btn primary"
                  onClick={() => void loadUsageByDate()}
                  disabled={isLoadingUsage}
                >
                  <CalendarDays size={14} /> {isLoadingUsage ? "Đang tra cứu..." : "Tra cứu"}
                </button>
                <button
                  type="button"
                  className="rooms-btn"
                  onClick={() => setShowUsagePanel(false)}
                >
                  Ẩn khung
                </button>
              </div>
            </div>

            {usageRows.length > 0 ? (
              <div className="rooms-import-results">
                <div style={{ marginBottom: 8, fontSize: 12, color: "#475569" }}>
                  Tổng kết quả: {usageTotalCount}
                </div>
                <table className="rooms-table">
                  <thead>
                    <tr>
                      <th>CommitteeID</th>
                      <th>CommitteeCode</th>
                      <th>CommitteeName</th>
                      <th>DefenseTermId</th>
                      <th>DefenseDate</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageRows.map((item, index) => (
                      <tr key={`${item.committeeCode}-${item.defenseDate}-${index}`}>
                        <td>{item.committeeID ?? "-"}</td>
                        <td>{item.committeeCode}</td>
                        <td>{item.committeeName}</td>
                        <td>{item.defenseTermId ?? "-"}</td>
                        <td>{item.defenseDate}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rooms-empty-state">
                {isLoadingUsage ? "Đang tải usage..." : "Không có dữ liệu usage theo điều kiện đã nhập."}
              </div>
            )}
          </section>
        )}

        {showImportPanel && (
          <section className="rooms-import">
            <h3>Import phòng từ Excel</h3>
            <div className="rooms-import-row">
              <input
                type="file"
                accept=".xlsx"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                style={{ paddingLeft: 12 }}
              />
              <label>
                <input
                  type="checkbox"
                  checked={upsertMode}
                  onChange={(event) => setUpsertMode(event.target.checked)}
                />
                upsert=true
              </label>
              <button
                type="button"
                className="rooms-btn primary"
                onClick={() => void importRooms()}
                disabled={isImporting}
              >
                <Upload size={14} /> {isImporting ? "Đang import" : "Import"}
              </button>
            </div>

            {importFile && (
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>
                File đã chọn: {importFile.name}
              </div>
            )}

            {importResult && (
              <>
                <div style={{ marginTop: 8, marginBottom: 8, fontSize: 13, color: "#334155" }}>
                  TotalRows: {importResult.totalRows} | Created: {importResult.createdCount} |
                  Updated: {importResult.updatedCount} | Failed: {importResult.failedCount}
                </div>

                <div className="rooms-import-results">
                  <table className="rooms-table">
                    <thead>
                      <tr>
                        <th>RowNumber</th>
                        <th>RoomCode</th>
                        <th>Status</th>
                        <th>Result</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.rows.map((row) => (
                        <tr key={`${row.rowNumber}-${row.roomCode}-${row.result}`}>
                          <td>{row.rowNumber}</td>
                          <td>{row.roomCode}</td>
                          <td>{row.status}</td>
                          <td style={{ color: actionColor(row.result), fontWeight: 700 }}>
                            {row.result}
                          </td>
                          <td>{row.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {showForm && (
          <div className="rooms-modal-overlay">
            <div className="rooms-modal">
              <h3>{editingRoomId ? "Sửa phòng" : "Tạo phòng mới"}</h3>
              <div style={{ display: "grid", gap: 10 }}>
                <label className="rooms-field">
                  <span>RoomCode *</span>
                  <input
                    value={formState.roomCode}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, roomCode: event.target.value }))
                    }
                    maxLength={40}
                  />
                </label>
                <label className="rooms-field">
                  <span>Status (tối đa 50 ký tự)</span>
                  <input
                    value={formState.status}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, status: event.target.value }))
                    }
                    maxLength={50}
                  />
                </label>
              </div>

              <div className="rooms-modal-actions" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="rooms-btn"
                  onClick={() => setShowForm(false)}
                  disabled={isSavingRoom}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="rooms-btn primary"
                  onClick={() => void saveRoom()}
                  disabled={isSavingRoom}
                >
                  {isSavingRoom ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDetailModal && (
          <div className="rooms-modal-overlay">
            <div className="rooms-modal">
              <h3>Chi tiết phòng</h3>

              {isLoadingDetail && <div className="rooms-loading-state">Đang tải chi tiết...</div>}

              {!isLoadingDetail && detailRoom && (
                <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
                  <div>
                    <strong>RoomID:</strong> {detailRoom.roomID}
                  </div>
                  <div>
                    <strong>RoomCode:</strong> {detailRoom.roomCode}
                  </div>
                  <div>
                    <strong>Status:</strong> {normalizeStatusLabel(detailRoom.status)}
                  </div>
                  <div>
                    <strong>CreatedAt:</strong> {detailRoom.createdAt}
                  </div>
                  <div>
                    <strong>LastUpdated:</strong> {detailRoom.lastUpdated}
                  </div>
                </div>
              )}

              {!isLoadingDetail && !detailRoom && (
                <div className="rooms-empty-state">Không có dữ liệu chi tiết.</div>
              )}

              <div className="rooms-modal-actions" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="rooms-btn"
                  onClick={() => setShowDetailModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsManagement;
