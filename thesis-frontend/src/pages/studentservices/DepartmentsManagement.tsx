import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Eye, Filter, Plus, Search, Trash2 } from "lucide-react";
import { fetchData } from "../../api/fetchData";
import ImportExportActions from "../../components/admin/ImportExportActions.tsx";
import TablePagination from "../../components/TablePagination/TablePagination";
import { useToast } from "../../context/useToast";
import type { ApiResponse } from "../../types/api";
import "./DepartmentsManagement.css";

type RecordData = Record<string, unknown>;
type FieldType = "text" | "number" | "date" | "textarea";

interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
}

interface ColumnDef {
  key: string;
  label: string;
  aliases?: string[];
}

type LecturerProfile = {
  lecturerProfileID: number;
  lecturerCode: string;
  userCode: string;
  departmentCode: string;
  degree?: string;
  guideQuota?: number;
  defenseQuota?: number;
  currentGuidingCount?: number;
  gender?: string;
  dateOfBirth?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string | null;
  address?: string;
  notes?: string | null;
  fullName: string;
  createdAt?: string;
  lastUpdated?: string;
};

const fields: FieldDef[] = [
  { name: "departmentCode", label: "departmentCode", required: true },
  { name: "name", label: "name", required: true },
  { name: "description", label: "description", type: "textarea" },
];

const createFields = fields;
const editFields = fields.filter((field) => field.name !== "departmentCode");

const filterFields: FieldDef[] = [
  { name: "departmentCode", label: "Mã khoa/bộ môn" },
  { name: "name", label: "Tên khoa/bộ môn" },
];

const columns: ColumnDef[] = [
  { key: "departmentCode", label: "Mã khoa/bộ môn", aliases: ["code"] },
  { key: "name", label: "Tên khoa/bộ môn", aliases: ["departmentName"] },
  { key: "description", label: "Mô tả", aliases: ["departmentDescription"] },
];

function toDisplay(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getColumnValue(row: RecordData, column: ColumnDef): unknown {
  const keys = [column.key, ...(column.aliases ?? [])];
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return "";
}

function toFormRecord(
  data: RecordData,
  schemaFields: FieldDef[] = fields,
): Record<string, string> {
  return schemaFields.reduce<Record<string, string>>((acc, field) => {
    acc[field.name] = toDisplay(data[field.name]);
    return acc;
  }, {});
}

function toPayload(
  formValues: Record<string, string>,
  schemaFields: FieldDef[] = fields,
): RecordData {
  return schemaFields.reduce<RecordData>((acc, field) => {
    const raw = (formValues[field.name] ?? "").trim();
    if (!raw) {
      acc[field.name] = field.type === "number" ? null : "";
      return acc;
    }
    if (field.type === "number") {
      const parsed = Number(raw);
      acc[field.name] = Number.isFinite(parsed) ? parsed : raw;
      return acc;
    }
    acc[field.name] = raw;
    return acc;
  }, {});
}

function buildQuery(input: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    params.append(key, normalized);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function requestApiData<T>(
  path: string,
  options?: Parameters<typeof fetchData>[1],
  fallback = "Không thể tải dữ liệu.",
): Promise<{ data: T; totalCount: number }> {
  const response = await fetchData<ApiResponse<T>>(path, options);
  if (!response?.success) {
    throw new Error(response.message || response.title || fallback);
  }
  return {
    data: response.data as T,
    totalCount: Number(response.totalCount || 0),
  };
}

function normalizeList(payload: unknown): {
  items: RecordData[];
  fallbackTotal: number;
} {
  if (Array.isArray(payload)) {
    return { items: payload as RecordData[], fallbackTotal: payload.length };
  }
  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    const nested = [
      source.items,
      source.records,
      source.result,
      source.data,
      source.list,
    ];
    const arr = nested.find((candidate) => Array.isArray(candidate));
    if (Array.isArray(arr)) {
      return {
        items: arr as RecordData[],
        fallbackTotal: Number(
          source.totalCount ?? source.total ?? source.count ?? arr.length,
        ),
      };
    }
  }
  return { items: [], fallbackTotal: 0 };
}

function getDepartmentToken(row: RecordData): string {
  const token =
    row.departmentID ?? row.departmentId ?? row.departmentCode ?? row.code;
  return String(token ?? "").trim();
}

function getDepartmentCode(row: RecordData): string {
  return String(row.departmentCode || row.code || "--");
}

function getDepartmentName(row: RecordData): string {
  return String(row.name || row.departmentName || row.title || "--");
}

function getDepartmentDescription(row: RecordData): string {
  return String(row.description || row.departmentDescription || "--");
}

function getLecturerDisplayName(lecturer: LecturerProfile): string {
  return lecturer.fullName || "--";
}

function getLecturerCode(lecturer: LecturerProfile): string {
  return lecturer.lecturerCode || lecturer.userCode || "--";
}

function formatDateTime(value?: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
}

const DepartmentsManagement: React.FC = () => {
  const { addToast } = useToast();
  const [rows, setRows] = useState<RecordData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "detail" | "create" | "edit" | null
  >(null);
  const [selectedRow, setSelectedRow] = useState<RecordData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "lecturers">("info");
  const [lecturers, setLecturers] = useState<LecturerProfile[]>([]);
  const [lecturersLoading, setLecturersLoading] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<
    Record<string, string>
  >(() =>
    filterFields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {}),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize,
      search: searchKeyword,
      ...advancedFilters,
    }),
    [advancedFilters, page, pageSize, searchKeyword],
  );

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = buildQuery(listQuery);
      const { data, totalCount: apiTotal } = await requestApiData<unknown>(
        `/Departments/get-list${query}`,
        { method: "GET" },
        "Không thể tải danh sách khoa/bộ môn.",
      );
      const normalized = normalizeList(data);
      setRows(normalized.items);
      setTotalCount(apiTotal > 0 ? apiTotal : normalized.fallbackTotal);
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách khoa/bộ môn.",
        "error",
      );
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [addToast, listQuery]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize))),
    [pageSize, totalCount],
  );

  const openCreate = async () => {
    try {
      const { data } = await requestApiData<RecordData>(
        "/Departments/get-create",
        { method: "GET" },
        "Không thể tải mẫu tạo mới.",
      );
      setFormValues(toFormRecord(data || {}, createFields));
    } catch {
      setFormValues(toFormRecord({}, createFields));
    }
    setSelectedRow(null);
    setActiveModal("create");
  };

  const openEdit = async (row: RecordData) => {
    const token = getDepartmentToken(row);
    if (!token) {
      addToast("Không xác định được phòng ban để cập nhật.", "error");
      return;
    }
    try {
      const { data } = await requestApiData<RecordData>(
        `/Departments/get-update/${encodeURIComponent(token)}`,
        { method: "GET" },
        "Không thể tải dữ liệu cập nhật.",
      );
      const mergedRow = { ...row, ...(data || {}) };
      setFormValues(toFormRecord(mergedRow, editFields));
      setSelectedRow(row);
      setActiveModal("edit");
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu cập nhật.",
        "error",
      );
    }
  };

  const openDetail = async (row: RecordData) => {
    const token = getDepartmentToken(row);
    if (!token) {
      setSelectedRow(row);
      setDetailTab("info");
      setActiveModal("detail");
      return;
    }

    try {
      const { data } = await requestApiData<RecordData>(
        `/Departments/get-detail/${encodeURIComponent(token)}`,
        { method: "GET" },
        "Không thể tải chi tiết khoa/bộ môn.",
      );
      setSelectedRow(data);
    } catch {
      setSelectedRow(row);
    }
    setDetailTab("info");
    setLecturers([]);
    setActiveModal("detail");
  };

  useEffect(() => {
    const loadLecturers = async () => {
      if (activeModal !== "detail" || detailTab !== "lecturers") return;

      const departmentCode = getDepartmentCode(selectedRow || {});
      if (!departmentCode || departmentCode === "--") {
        setLecturers([]);
        return;
      }

      setLecturersLoading(true);
      try {
        const { data } = await requestApiData<unknown>(
          `/LecturerProfiles/get-list?DepartmentCode=${encodeURIComponent(departmentCode)}&Page=0&PageSize=10`,
          { method: "GET" },
          "Không thể tải danh sách giảng viên.",
        );
        const normalized = normalizeList(data);
        setLecturers(normalized.items as LecturerProfile[]);
      } catch (error) {
        addToast(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách giảng viên.",
          "error",
        );
        setLecturers([]);
      } finally {
        setLecturersLoading(false);
      }
    };

    void loadLecturers();
  }, [activeModal, addToast, detailTab, selectedRow]);

  const handleDelete = async (row: RecordData) => {
    const token = getDepartmentToken(row);
    if (!token) {
      addToast(
        "Không xác định được departmentID/departmentCode để xóa.",
        "error",
      );
      return;
    }
    if (!window.confirm("Bạn chắc chắn muốn xóa bản ghi này?")) return;

    try {
      await requestApiData<unknown>(
        `/Departments/delete/${encodeURIComponent(token)}`,
        { method: "DELETE" },
        "Không thể xóa bản ghi.",
      );
      addToast("Xóa dữ liệu thành công.", "success");
      await loadRows();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể xóa bản ghi.",
        "error",
      );
    }
  };

  const handleSubmit = async () => {
    const schemaFields = activeModal === "edit" ? editFields : createFields;
    const payload = toPayload(formValues, schemaFields);
    const required = schemaFields.find((field) => {
      if (!field.required) return false;
      const value = payload[field.name];
      return (
        value === null || value === undefined || String(value).trim() === ""
      );
    });

    if (required) {
      addToast(`Trường ${required.label} là bắt buộc.`, "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeModal === "create") {
        await requestApiData<RecordData>(
          "/Departments/create",
          { method: "POST", body: payload },
          "Không thể tạo bản ghi.",
        );
        addToast("Tạo mới thành công.", "success");
      }

      if (activeModal === "edit" && selectedRow) {
        const token = getDepartmentToken(selectedRow);
        await requestApiData<RecordData>(
          `/Departments/update/${encodeURIComponent(token)}`,
          { method: "PUT", body: payload },
          "Không thể cập nhật bản ghi.",
        );
        addToast("Cập nhật thành công.", "success");
      }

      setActiveModal(null);
      await loadRows();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể lưu dữ liệu.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchKeyword("");
    setAdvancedFilters(
      filterFields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {}),
    );
    setPage(1);
  };

  return (
    <div className="departments-module">
      <div className="departments-header">
        <h1>Quản lý khoa/bộ môn</h1>
        <p>
          Dữ liệu chuẩn theo schema Departments (departmentCode, name,
          description).
        </p>
      </div>

      <div className="departments-toolbar">
        <div className="departments-search-wrap">
          <Search size={16} />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Tìm kiếm nhanh..."
          />
        </div>

        <div className="departments-actions-wrap">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className="departments-filter-btn"
          >
            <Filter size={14} />
            {showAdvancedFilters ? "Ẩn lọc" : "Lọc nâng cao"}
          </button>
          <ImportExportActions
            moduleName="departments"
            moduleLabel="Quản lý khoa/bộ môn"
            onImportSuccess={loadRows}
          />
          <button
            type="button"
            onClick={openCreate}
            className="departments-create-btn"
          >
            <Plus size={14} /> Thêm mới
          </button>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="departments-filter-panel">
          <div className="departments-filter-grid">
            {filterFields.map((field) => (
              <label key={field.name} className="departments-filter-field">
                <span>{field.label}</span>
                <input
                  type={
                    field.type === "number"
                      ? "number"
                      : field.type === "date"
                        ? "date"
                        : "text"
                  }
                  value={advancedFilters[field.name] ?? ""}
                  onChange={(event) => {
                    const next = event.target.value;
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      [field.name]: next,
                    }));
                    setPage(1);
                  }}
                />
              </label>
            ))}
          </div>

          <div className="departments-filter-actions">
            <button
              type="button"
              onClick={resetFilters}
              className="departments-reset-btn"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      )}

      <div className="departments-table-wrap">
        <table className="departments-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th style={{ textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1}>Đang tải dữ liệu...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}>Không có dữ liệu.</td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`departments-${index}-${getDepartmentToken(row) || String(row.departmentCode ?? "")}`}
                >
                  {columns.map((column) => (
                    <td key={`${column.key}-${index}`}>
                      {toDisplay(getColumnValue(row, column))}
                    </td>
                  ))}
                  <td>
                    <div className="departments-action-buttons">
                      <button
                        type="button"
                        onClick={() => void openDetail(row)}
                        className="departments-icon-btn"
                        title="Chi tiết"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void openEdit(row)}
                        className="departments-icon-btn"
                        title="Cập nhật"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row)}
                        className="departments-icon-btn departments-icon-btn-danger"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        totalCount={totalCount}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        isLoading={isLoading}
        pageSizeOptions={[10, 20, 50, 100]}
        totalLabel="Tổng bản ghi:"
        pageSizeLabel="Số dòng/trang"
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      {activeModal && (
        <div className="departments-modal-overlay">
          <div className="departments-modal">
            {activeModal !== "detail" && (
              <button
                type="button"
                className="departments-modal-close"
                onClick={() => setActiveModal(null)}
              >
                x
              </button>
            )}

            {activeModal === "detail" ? (
              <div className="departments-detail-shell">
                <div className="departments-detail-header">
                  <div className="departments-detail-title">
                    <span className="departments-badge">Phòng ban</span>
                    <h3>{getDepartmentName(selectedRow || {})}</h3>
                  </div>

                  <div className="departments-detail-actions">
                    <button
                      type="button"
                      className="departments-secondary-btn"
                      onClick={() => {
                        if (selectedRow) {
                          void openEdit(selectedRow);
                          setActiveModal(null);
                        }
                      }}
                    >
                      <Edit size={13} />
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="departments-secondary-btn departments-secondary-btn-danger"
                      onClick={() => setActiveModal(null)}
                    >
                      Đóng
                    </button>
                  </div>
                </div>

                <div className="departments-detail-tabs">
                  <button
                    type="button"
                    className={detailTab === "info" ? "is-active" : ""}
                    onClick={() => setDetailTab("info")}
                  >
                    Thông tin khoa
                  </button>
                  <button
                    type="button"
                    className={detailTab === "lecturers" ? "is-active" : ""}
                    onClick={() => setDetailTab("lecturers")}
                  >
                    Danh sách giảng viên
                  </button>
                </div>

                {detailTab === "info" ? (
                  <div className="departments-detail-grid">
                    <div className="departments-detail-card">
                      <span className="departments-detail-label">
                        Mã phòng ban
                      </span>
                      <strong>{getDepartmentCode(selectedRow || {})}</strong>
                    </div>
                    <div className="departments-detail-card">
                      <span className="departments-detail-label">
                        Tên phòng ban
                      </span>
                      <strong>{getDepartmentName(selectedRow || {})}</strong>
                    </div>
                    <div className="departments-detail-card">
                      <span className="departments-detail-label">
                        createdAt
                      </span>
                      <strong>
                        {formatDateTime(
                          selectedRow?.createdAt as string | undefined,
                        )}
                      </strong>
                    </div>
                    <div className="departments-detail-card">
                      <span className="departments-detail-label">
                        lastUpdated
                      </span>
                      <strong>
                        {formatDateTime(
                          selectedRow?.lastUpdated as string | undefined,
                        )}
                      </strong>
                    </div>
                    <div className="departments-detail-card departments-detail-card-wide">
                      <span className="departments-detail-label">Mô tả</span>
                      <p>{getDepartmentDescription(selectedRow || {})}</p>
                    </div>
                  </div>
                ) : (
                  <div className="departments-lecturers-panel">
                    {lecturersLoading ? (
                      <div className="departments-lecturers-empty">
                        Đang tải danh sách giảng viên...
                      </div>
                    ) : lecturers.length === 0 ? (
                      <div className="departments-lecturers-empty">
                        Không có giảng viên thuộc khoa này.
                      </div>
                    ) : (
                      <div className="departments-lecturers-table-wrap">
                        <table className="departments-lecturers-table">
                          <thead>
                            <tr>
                              <th>GIẢNG VIÊN</th>
                              <th>LIÊN HỆ</th>
                              <th>HỌC VỊ</th>
                              <th>BẢO VỆ</th>
                              <th>ĐANG HƯỚNG DẪN</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lecturers.map((lecturer) => (
                              <tr key={lecturer.lecturerProfileID}>
                                <td>
                                  <div className="departments-lecturer-table-name">
                                    <div className="departments-lecturer-table-avatar">
                                      {lecturer.profileImage ? (
                                        <img
                                          src={lecturer.profileImage}
                                          alt={lecturer.fullName}
                                        />
                                      ) : (
                                        <span>
                                          {getLecturerDisplayName(
                                            lecturer,
                                          ).charAt(0) || "L"}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <strong>
                                        {getLecturerDisplayName(lecturer)}
                                      </strong>
                                      <div className="departments-lecturer-table-code">
                                        {getLecturerCode(lecturer)}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="departments-lecturer-contact-cell">
                                    <span>{lecturer.email || "--"}</span>
                                    <span>{lecturer.phoneNumber || "--"}</span>
                                  </div>
                                </td>
                                <td>{lecturer.degree || "--"}</td>
                                <td>{lecturer.defenseQuota ?? "--"}</td>
                                <td>
                                  <div className="departments-lecturer-progress-cell">
                                    <div className="departments-lecturer-progress-track">
                                      <div
                                        className="departments-lecturer-progress-fill"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            Math.round(
                                              ((lecturer.currentGuidingCount ??
                                                0) /
                                                Math.max(
                                                  lecturer.guideQuota ?? 1,
                                                  1,
                                                )) *
                                                100,
                                            ),
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                    <strong>
                                      {lecturer.currentGuidingCount ?? 0}/
                                      {lecturer.guideQuota ?? "--"}
                                    </strong>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="departments-form-shell">
                <div className="departments-modal-header">
                  <h3>
                    {activeModal === "create"
                      ? "Tạo khoa/bộ môn"
                      : "Cập nhật khoa/bộ môn"}
                  </h3>
                  <p>
                    {activeModal === "create"
                      ? "Nhập thông tin phòng ban mới theo schema Departments."
                      : "Chỉnh sửa tên và mô tả phòng ban."}
                  </p>
                </div>

                <div className="departments-form-grid">
                  {(activeModal === "create" ? createFields : editFields).map(
                    (field) => {
                      const value = formValues[field.name] ?? "";
                      return (
                        <label
                          key={field.name}
                          className={`departments-form-field ${field.type === "textarea" ? "departments-form-field-full" : ""}`}
                        >
                          <span>
                            {field.label}
                            {field.required ? " *" : ""}
                          </span>
                          {field.type === "textarea" ? (
                            <textarea
                              value={value}
                              onChange={(event) =>
                                setFormValues((prev) => ({
                                  ...prev,
                                  [field.name]: event.target.value,
                                }))
                              }
                              rows={4}
                            />
                          ) : (
                            <input
                              type={
                                field.type === "number"
                                  ? "number"
                                  : field.type === "date"
                                    ? "date"
                                    : "text"
                              }
                              value={value}
                              onChange={(event) =>
                                setFormValues((prev) => ({
                                  ...prev,
                                  [field.name]: event.target.value,
                                }))
                              }
                            />
                          )}
                        </label>
                      );
                    },
                  )}
                </div>

                <div className="departments-form-actions">
                  <button
                    type="button"
                    className="departments-cancel-btn"
                    onClick={() => setActiveModal(null)}
                    disabled={isSubmitting}
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="departments-save-btn"
                    onClick={() => void handleSubmit()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsManagement;
