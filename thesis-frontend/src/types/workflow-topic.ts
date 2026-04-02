export type WorkflowStatusCode =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "REVISION_REQUIRED"
  | "UNKNOWN";

export type WorkflowDecisionAction = "approve" | "reject" | "revision";

export interface WorkflowTopic {
  topicID: number;
  topicCode: string;
  title: string;
  summary: string;
  type: string;
  defenseTermId: number | null;
  proposerUserID: number;
  proposerUserCode: string;
  proposerStudentProfileID: number;
  proposerStudentCode: string;
  supervisorUserID: number | null;
  supervisorUserCode: string | null;
  supervisorLecturerProfileID: number | null;
  supervisorLecturerCode: string | null;
  catalogTopicID: number | null;
  catalogTopicCode: string | null;
  departmentID: number | null;
  departmentCode: string | null;
  status: string;
  resubmitCount: number | null;
  createdAt: string;
  lastUpdated: string;
  lecturerComment?: string | null;
}

export interface WorkflowResubmitRequest {
  topicID: number | null;
  topicCode: string | null;
  title: string;
  summary: string;
  type: "CATALOG" | "SELF";
  defenseTermId: number;
  proposerUserID: number;
  proposerUserCode: string;
  proposerStudentProfileID: number;
  proposerStudentCode: string;
  supervisorUserID: number;
  supervisorUserCode: string;
  supervisorLecturerProfileID: number;
  supervisorLecturerCode: string;
  catalogTopicID: number | null;
  catalogTopicCode: string | null;
  departmentID: number;
  departmentCode: string;
  tagIDs: number[];
  tagCodes: string[];
  useCatalogTopicTags: boolean;
  forceCreateNewTopic: boolean;
  studentNote: string;
}

export interface DefenseTermOption {
  defenseTermId: number;
  defenseTermCode: string;
  defenseTermName: string;
  status?: string;
}

export interface WorkflowMutationResponse {
  topic: WorkflowTopic;
  tagCodes: string[];
  milestoneState: string;
  statusCode: string;
  isNewTopic: boolean;
  message: string;
}

export interface WorkflowDecisionRequest {
  action: WorkflowDecisionAction;
  comment: string;
}

export interface WorkflowDetailResponse {
  topic: WorkflowTopic;
  tagCodes: string[];
  milestoneState: string;
  milestoneTemplateCode: string | null;
  ordinal: number | null;
  completedAt1: string | null;
  completedAt2: string | null;
  completedAt3: string | null;
  completedAt4: string | null;
  completedAt5: string | null;
  resubmitCount: number | null;
  latestLecturerComment: string | null;
}

export interface WorkflowTimelineEvent {
  auditID: number;
  auditCode: string;
  actionType: string;
  decisionAction: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  statusCode: string | null;
  commentText: string | null;
  actorUserCode: string | null;
  isSuccess: number;
  createdAt: string;
}

export interface WorkflowTimelineResponse {
  topicID: number;
  topicCode: string;
  events: WorkflowTimelineEvent[];
}

export interface WorkflowAuditFilter {
  topicID?: number;
  topicCode?: string;
  actionType?: string;
  statusCode?: string;
  isSuccess?: 0 | 1;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

export interface WorkflowAuditItem {
  auditID: number;
  auditCode: string;
  actionType: string;
  decisionAction: string | null;
  topicID: number;
  topicCode: string;
  oldStatus: string | null;
  newStatus: string | null;
  statusCode: string | null;
  resubmitCountBefore: number | null;
  resubmitCountAfter: number | null;
  commentText: string | null;
  isSuccess: number;
  errorMessage: string | null;
  actorUserCode: string | null;
  actorRole: string | null;
  correlationID: string | null;
  createdAt: string;
}

export interface WorkflowRollbackResponse {
  topicsDeleted: number;
  topicTagsDeleted: number;
  topicLecturersDeleted: number;
  progressMilestonesDeleted: number;
  conversationMembersDeleted: number;
  directConversationsDeleted: number;
  message: string;
}
