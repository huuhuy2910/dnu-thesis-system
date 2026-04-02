export type ManagementModule =
  | "students"
  | "lecturers"
  | "departments"
  | "topics"
  | "tags"
  | "catalogtopics";

export type RecordData = Record<string, unknown>;

export type FieldType = "text" | "number" | "date" | "textarea";

export interface EntityField {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
}

export interface ModuleApiConfig {
  listPath: string;
  detailPath: (code: string) => string;
  createTemplatePath: string;
  createPath: string;
  updateTemplatePath: (token: string | number) => string;
  updatePath: (token: string | number) => string;
  deletePath: (token: string | number) => string;
}

export interface DataExchangeConfig {
  importPath: string;
  exportPath?: string;
  previewPath?: string;
  importUsesFormatQuery?: boolean;
  exportUsesFormatQuery?: boolean;
  importNotes?: string[];
}

export interface EntityConfig {
  moduleName: ManagementModule;
  title: string;
  description: string;
  tableColumns: Array<{ key: string; label: string }>;
  fields: EntityField[];
  advancedFilters: EntityField[];
  api: ModuleApiConfig;
  exchange: DataExchangeConfig;
  getDetailCode: (row: RecordData) => string;
  getUpdateToken: (row: RecordData) => string | number;
  getDeleteToken: (row: RecordData) => string | number;
  validate?: (payload: RecordData) => string | null;
}

const studentsFields: EntityField[] = [
  { name: "studentCode", label: "studentCode" },
  { name: "userCode", label: "userCode", required: true },
  { name: "departmentCode", label: "departmentCode" },
  { name: "classCode", label: "classCode" },
  { name: "facultyCode", label: "facultyCode" },
  { name: "studentImage", label: "studentImage" },
  { name: "fullName", label: "fullName" },
  { name: "studentEmail", label: "studentEmail" },
  { name: "phoneNumber", label: "phoneNumber" },
  { name: "academicStanding", label: "academicStanding" },
  { name: "status", label: "status" },
  { name: "enrollmentYear", label: "enrollmentYear", type: "number" },
  { name: "graduationYear", label: "graduationYear", type: "number" },
  { name: "gender", label: "gender" },
  { name: "dateOfBirth", label: "dateOfBirth", type: "date" },
  { name: "gpa", label: "gpa", type: "number" },
  { name: "address", label: "address" },
  { name: "notes", label: "notes", type: "textarea" },
];

const lecturersFields: EntityField[] = [
  { name: "lecturerCode", label: "lecturerCode" },
  { name: "userCode", label: "userCode", required: true },
  { name: "departmentCode", label: "departmentCode" },
  { name: "fullName", label: "fullName" },
  { name: "degree", label: "degree" },
  { name: "email", label: "email" },
  { name: "phoneNumber", label: "phoneNumber" },
  { name: "guideQuota", label: "guideQuota", type: "number" },
  { name: "defenseQuota", label: "defenseQuota", type: "number" },
  { name: "currentGuidingCount", label: "currentGuidingCount", type: "number" },
  { name: "profileImage", label: "profileImage" },
  { name: "gender", label: "gender" },
  { name: "dateOfBirth", label: "dateOfBirth", type: "date" },
  { name: "address", label: "address" },
  { name: "notes", label: "notes", type: "textarea" },
];

const departmentsFields: EntityField[] = [
  { name: "departmentCode", label: "departmentCode" },
  { name: "name", label: "name", required: true },
  { name: "description", label: "description", type: "textarea" },
];

const topicsFields: EntityField[] = [
  { name: "topicCode", label: "topicCode" },
  { name: "title", label: "title", required: true },
  { name: "summary", label: "summary", type: "textarea" },
  { name: "type", label: "type" },
  { name: "proposerUserID", label: "proposerUserID", type: "number" },
  { name: "proposerUserCode", label: "proposerUserCode" },
  {
    name: "proposerStudentProfileID",
    label: "proposerStudentProfileID",
    type: "number",
  },
  { name: "proposerStudentCode", label: "proposerStudentCode" },
  { name: "supervisorUserID", label: "supervisorUserID", type: "number" },
  { name: "supervisorUserCode", label: "supervisorUserCode" },
  {
    name: "supervisorLecturerProfileID",
    label: "supervisorLecturerProfileID",
    type: "number",
  },
  { name: "supervisorLecturerCode", label: "supervisorLecturerCode" },
  { name: "catalogTopicID", label: "catalogTopicID", type: "number" },
  { name: "catalogTopicCode", label: "catalogTopicCode" },
  { name: "departmentID", label: "departmentID", type: "number" },
  { name: "departmentCode", label: "departmentCode" },
  { name: "status", label: "status" },
  { name: "resubmitCount", label: "resubmitCount", type: "number" },
  { name: "lecturerComment", label: "lecturerComment", type: "textarea" },
];

export const academicModuleConfig: Record<ManagementModule, EntityConfig> = {
  students: {
    moduleName: "students",
    title: "Quản lý sinh viên",
    description: "CRUD hồ sơ sinh viên và import/export dữ liệu.",
    tableColumns: [
      { key: "studentCode", label: "Mã SV" },
      { key: "fullName", label: "Họ tên" },
      { key: "classCode", label: "Lớp" },
      { key: "departmentCode", label: "Khoa/Bộ môn" },
      { key: "studentEmail", label: "Email" },
      { key: "status", label: "Trạng thái" },
    ],
    fields: studentsFields,
    advancedFilters: [
      { name: "studentCode", label: "Mã sinh viên" },
      { name: "userCode", label: "Mã user" },
      { name: "departmentCode", label: "Khoa/Bộ môn" },
      { name: "classCode", label: "Lớp" },
      { name: "facultyCode", label: "Khoa viện" },
      { name: "academicStanding", label: "Học lực" },
      { name: "status", label: "Trạng thái" },
      { name: "enrollmentYear", label: "Năm nhập học", type: "number" },
      { name: "graduationYear", label: "Năm tốt nghiệp", type: "number" },
      { name: "gender", label: "Giới tính" },
    ],
    api: {
      listPath: "/StudentProfiles/get-list",
      detailPath: (code) =>
        `/StudentProfiles/get-detail/${encodeURIComponent(code)}`,
      createTemplatePath: "/StudentProfiles/get-create",
      createPath: "/StudentProfiles/create",
      updateTemplatePath: (token) =>
        `/StudentProfiles/get-update/${encodeURIComponent(String(token))}`,
      updatePath: (token) =>
        `/StudentProfiles/update/${encodeURIComponent(String(token))}`,
      deletePath: (token) =>
        `/StudentProfiles/delete/${encodeURIComponent(String(token))}`,
    },
    exchange: {
      importPath: "/DataExchange/import/students",
      exportPath: "/DataExchange/export/students",
      previewPath: "/StudentProfiles/get-list?page=1&pageSize=5",
      importUsesFormatQuery: true,
      exportUsesFormatQuery: true,
    },
    getDetailCode: (row) => String(row.studentCode ?? ""),
    getUpdateToken: (row) => String(row.studentCode ?? ""),
    getDeleteToken: (row) => String(row.studentCode ?? ""),
  },
  lecturers: {
    moduleName: "lecturers",
    title: "Quản lý giảng viên",
    description: "CRUD hồ sơ giảng viên và import/export dữ liệu.",
    tableColumns: [
      { key: "lecturerCode", label: "Mã GV" },
      { key: "fullName", label: "Họ tên" },
      { key: "departmentCode", label: "Khoa/Bộ môn" },
      { key: "email", label: "Email" },
      { key: "degree", label: "Học vị" },
      { key: "currentGuidingCount", label: "Đang hướng dẫn" },
    ],
    fields: lecturersFields,
    advancedFilters: [
      { name: "lecturerCode", label: "Mã giảng viên" },
      { name: "userCode", label: "Mã user" },
      { name: "departmentCode", label: "Khoa/Bộ môn" },
      { name: "degree", label: "Học vị" },
      { name: "guideQuota", label: "Chỉ tiêu hướng dẫn", type: "number" },
      { name: "gender", label: "Giới tính" },
    ],
    api: {
      listPath: "/LecturerProfiles/get-list",
      detailPath: (code) =>
        `/LecturerProfiles/get-detail/${encodeURIComponent(code)}`,
      createTemplatePath: "/LecturerProfiles/get-create",
      createPath: "/LecturerProfiles/create",
      updateTemplatePath: (token) =>
        `/LecturerProfiles/get-update/${encodeURIComponent(String(token))}`,
      updatePath: (token) =>
        `/LecturerProfiles/update/${encodeURIComponent(String(token))}`,
      deletePath: (token) =>
        `/LecturerProfiles/delete/${encodeURIComponent(String(token))}`,
    },
    exchange: {
      importPath: "/DataExchange/import/lecturers",
      exportPath: "/DataExchange/export/lecturers",
      previewPath: "/LecturerProfiles/get-list?page=1&pageSize=5",
      importUsesFormatQuery: true,
      exportUsesFormatQuery: true,
    },
    getDetailCode: (row) => String(row.lecturerCode ?? ""),
    getUpdateToken: (row) => String(row.lecturerCode ?? ""),
    getDeleteToken: (row) => String(row.lecturerCode ?? ""),
  },
  departments: {
    moduleName: "departments",
    title: "Quản lý khoa/bộ môn",
    description: "CRUD khoa/bộ môn và import/export dữ liệu.",
    tableColumns: [
      { key: "departmentCode", label: "Mã khoa" },
      { key: "name", label: "Tên" },
      { key: "description", label: "Mô tả" },
    ],
    fields: departmentsFields,
    advancedFilters: [
      { name: "departmentCode", label: "Mã khoa" },
      { name: "name", label: "Tên khoa/bộ môn" },
    ],
    api: {
      listPath: "/Departments/get-list",
      detailPath: (code) =>
        `/Departments/get-detail/${encodeURIComponent(code)}`,
      createTemplatePath: "/Departments/get-create",
      createPath: "/Departments/create",
      updateTemplatePath: (token) =>
        `/Departments/get-update/${encodeURIComponent(String(token))}`,
      updatePath: (token) =>
        `/Departments/update/${encodeURIComponent(String(token))}`,
      deletePath: (token) =>
        `/Departments/delete/${encodeURIComponent(String(token))}`,
    },
    exchange: {
      importPath: "/DataExchange/import/departments",
      exportPath: "/DataExchange/export/departments",
      previewPath: "/Departments/get-list?page=1&pageSize=5",
      importUsesFormatQuery: true,
      exportUsesFormatQuery: true,
    },
    getDetailCode: (row) => String(row.departmentCode ?? ""),
    getUpdateToken: (row) => String(row.departmentCode ?? ""),
    getDeleteToken: (row) => String(row.departmentCode ?? ""),
  },
  topics: {
    moduleName: "topics",
    title: "Quản lý đề tài",
    description: "CRUD đề tài và import/export dữ liệu.",
    tableColumns: [
      { key: "topicCode", label: "Mã đề tài" },
      { key: "title", label: "Tiêu đề" },
      { key: "proposerUserCode", label: "Người đề xuất" },
      { key: "supervisorLecturerCode", label: "GV hướng dẫn" },
      { key: "departmentCode", label: "Khoa" },
      { key: "status", label: "Trạng thái" },
    ],
    fields: topicsFields,
    advancedFilters: [
      { name: "topicCode", label: "Mã đề tài" },
      { name: "title", label: "Tiêu đề" },
      { name: "departmentCode", label: "Khoa/Bộ môn" },
      { name: "status", label: "Trạng thái" },
      { name: "type", label: "Loại đề tài" },
      { name: "proposerUserCode", label: "Mã người đề xuất" },
      { name: "supervisorUserCode", label: "Mã GV hướng dẫn" },
    ],
    api: {
      listPath: "/Topics/get-list",
      detailPath: (code) => `/Topics/get-detail/${encodeURIComponent(code)}`,
      createTemplatePath: "/Topics/get-create",
      createPath: "/Topics/create",
      updateTemplatePath: (token) =>
        `/Topics/get-update/${encodeURIComponent(String(token))}`,
      updatePath: (token) =>
        `/Topics/update/${encodeURIComponent(String(token))}`,
      deletePath: (token) =>
        `/Topics/delete/${encodeURIComponent(String(token))}`,
    },
    exchange: {
      importPath: "/DataExchange/import/topics",
      exportPath: "/DataExchange/export/topics",
      previewPath: "/Topics/get-list?page=1&pageSize=5",
      importUsesFormatQuery: true,
      exportUsesFormatQuery: true,
    },
    getDetailCode: (row) => String(row.topicCode ?? ""),
    getUpdateToken: (row) => String(row.topicCode ?? ""),
    getDeleteToken: (row) => String(row.topicCode ?? ""),
    validate: (payload) => {
      const proposerUserID = Number(payload.proposerUserID ?? 0);
      const proposerUserCode = String(payload.proposerUserCode ?? "").trim();
      if (!proposerUserID && !proposerUserCode) {
        return "Với đề tài, cần proposerUserID hoặc proposerUserCode.";
      }
      return null;
    },
  },
  tags: {
    moduleName: "tags",
    title: "Quản lý tags",
    description: "CRUD tag và import/export dữ liệu.",
    tableColumns: [
      { key: "tagCode", label: "Mã tag" },
      { key: "tagName", label: "Tên tag" },
      { key: "description", label: "Mô tả" },
    ],
    fields: [
      { name: "tagCode", label: "tagCode" },
      { name: "tagName", label: "tagName", required: true },
      { name: "description", label: "description", type: "textarea" },
    ],
    advancedFilters: [
      { name: "tagCode", label: "Mã tag" },
      { name: "tagName", label: "Tên tag" },
    ],
    api: {
      listPath: "/Tags/list",
      detailPath: (code) => `/Tags/get-by-code/${encodeURIComponent(code)}`,
      createTemplatePath: "/Tags/get-create",
      createPath: "/Tags/create",
      updateTemplatePath: (token) =>
        `/Tags/get-update/${encodeURIComponent(String(token))}`,
      updatePath: (token) =>
        `/Tags/update/${encodeURIComponent(String(token))}`,
      deletePath: (token) =>
        `/Tags/delete/${encodeURIComponent(String(token))}`,
    },
    exchange: {
      importPath: "/Tags/import",
      exportPath: "/Tags/export",
      previewPath: "/Tags/list?page=1&pageSize=5",
      importUsesFormatQuery: false,
      exportUsesFormatQuery: false,
      importNotes: [
        "tagName là bắt buộc.",
        "tagCode có thể để trống để hệ thống tự sinh hoặc map theo backend.",
        "description là tùy chọn.",
      ],
    },
    getDetailCode: (row) => String(row.tagCode ?? ""),
    getUpdateToken: (row) => String(row.tagID ?? row.tagCode ?? ""),
    getDeleteToken: (row) => String(row.tagID ?? row.tagCode ?? ""),
  },
  catalogtopics: {
    moduleName: "catalogtopics",
    title: "Kho đề tài có sẵn",
    description: "Quản trị kho đề tài có sẵn và import/export dữ liệu.",
    tableColumns: [
      { key: "catalogTopicCode", label: "Mã kho" },
      { key: "title", label: "Tiêu đề" },
      { key: "departmentCode", label: "Khoa/Bộ môn" },
      { key: "assignedStatus", label: "Trạng thái" },
      { key: "tagCodes", label: "Tags" },
    ],
    fields: [
      { name: "catalogTopicCode", label: "catalogTopicCode" },
      { name: "title", label: "title", required: true },
      { name: "summary", label: "summary", type: "textarea" },
      { name: "departmentCode", label: "departmentCode" },
      { name: "assignedStatus", label: "assignedStatus" },
      { name: "assignedAt", label: "assignedAt", type: "date" },
      { name: "tagCodes", label: "tagCodes" },
    ],
    advancedFilters: [
      { name: "catalogTopicCode", label: "Mã kho" },
      { name: "title", label: "Tiêu đề" },
      { name: "departmentCode", label: "Khoa/Bộ môn" },
      { name: "assignedStatus", label: "Trạng thái" },
      { name: "tagCode", label: "Mã tag" },
      { name: "tagName", label: "Tên tag" },
    ],
    api: {
      listPath: "/CatalogTopics/get-list-with-tags",
      detailPath: (code) =>
        `/CatalogTopics/get-detail/${encodeURIComponent(code)}`,
      createTemplatePath: "/CatalogTopics/get-create",
      createPath: "/CatalogTopics/create",
      updateTemplatePath: (token) =>
        `/CatalogTopics/get-update/${encodeURIComponent(String(token))}`,
      updatePath: (token) =>
        `/CatalogTopics/update/${encodeURIComponent(String(token))}`,
      deletePath: (token) =>
        `/CatalogTopics/delete/${encodeURIComponent(String(token))}`,
    },
    exchange: {
      importPath: "/DataExchange/import/catalogtopics",
      exportPath: "/DataExchange/export/catalogtopics",
      previewPath: "/CatalogTopics/get-list-with-tags?Page=1&PageSize=5",
      importUsesFormatQuery: false,
      exportUsesFormatQuery: true,
      importNotes: [
        "title là bắt buộc.",
        "tagCodes là danh sách phân tách bằng dấu ; hoặc ,.",
        "Nếu tagCodes để trống, backend sẽ giữ hoặc xóa tag theo quy ước của API.",
      ],
    },
    getDetailCode: (row) => String(row.catalogTopicCode ?? ""),
    getUpdateToken: (row) => String(row.catalogTopicCode ?? ""),
    getDeleteToken: (row) => String(row.catalogTopicCode ?? ""),
  },
};
