export type TopicRenameRequestStatus = string;

export type TopicRenameRequestReviewAction = "Approve" | "Reject";

export type TopicRenameRequestListFilter = {
  topicID?: number | string;
  topicCode?: string;
  status?: string;
  requestedByUserCode?: string;
  reviewedByUserCode?: string;
  oldTitle?: string;
  newTitle?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
};

export interface TopicRenameRequestListItem {
  topicRenameRequestID: number;
  requestCode: string;
  topicID: number | null;
  topicCode: string;
  oldTitle: string;
  newTitle: string;
  reason: string;
  status: TopicRenameRequestStatus;
  requestedByUserCode: string;
  requestedByName?: string;
  requestedByStudentCode?: string;
  reviewedByUserCode: string;
  reviewedByName?: string;
  reviewedByLecturerCode?: string;
  requestedByRole: string;
  reviewedByRole: string;
  createdAt: string;
  reviewedAt: string;
  appliedAt: string;
  raw: Record<string, unknown>;
}

export interface TopicRenameRequestCreateDto {
  topicID?: number | null;
  topicCode?: string | null;
  newTitle: string;
  reason: string;
  requestedByUserCode?: string | null;
  requestedByRole?: string | null;
  reviewedByUserCode?: string | null;
  reviewedByRole?: string | null;
  proposerUserCode?: string | null;
  proposerStudentCode?: string | null;
  supervisorUserCode?: string | null;
  supervisorLecturerCode?: string | null;
  studentFullName?: string | null;
  studentCode?: string | null;
  studentEmail?: string | null;
  studentPhoneNumber?: string | null;
  studentDateOfBirth?: string | null;
  studentGender?: string | null;
  studentDepartmentCode?: string | null;
  studentClassCode?: string | null;
  studentFacultyCode?: string | null;
  studentEnrollmentYear?: number | null;
  studentStatus?: string | null;
  studentAddress?: string | null;
  lecturerFullName?: string | null;
  lecturerCode?: string | null;
  lecturerEmail?: string | null;
  lecturerPhoneNumber?: string | null;
  lecturerDateOfBirth?: string | null;
  lecturerGender?: string | null;
  lecturerDepartmentCode?: string | null;
  lecturerDegree?: string | null;
  lecturerAddress?: string | null;
}

export interface TopicRenameRequestUpdateDto {
  newTitle: string;
  reason: string;
}

export interface TopicRenameRequestReviewDto {
  action: TopicRenameRequestReviewAction;
  comment?: string | null;
}

export interface TopicRenameRequestFileReadDto {
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  storageProvider?: string | null;
  isCurrent?: boolean;
  [key: string]: unknown;
}

export interface TopicRenameRequestHistoryItem {
  historyId: number;
  historyCode: string;
  topicID: number | null;
  topicCode: string;
  requestId: number | null;
  requestCode: string;
  previousTitle: string;
  effectiveAt: string;
  newTitle: string;
  changeType: string;
  changeReason: string;
  approvalComment: string;
  changedByUserCode: string;
  changedByRole: string;
  approvedByUserCode: string;
  approvedByRole: string;
  createdAt: string;
  lastUpdated: string;
  raw: Record<string, unknown>;
}

export interface TopicRenameRequestDetailDto {
  request: Record<string, unknown> | null;
  templateData: Record<string, unknown> | null;
  files: TopicRenameRequestFileReadDto[];
  history: TopicRenameRequestHistoryItem[];
}

export interface TopicRenameRequestCreateFormData {
  topicID: string;
  topicCode: string;
  newTitle: string;
  reason: string;
}

export interface TopicRenameRequestUpdateFormData {
  newTitle: string;
  reason: string;
}
