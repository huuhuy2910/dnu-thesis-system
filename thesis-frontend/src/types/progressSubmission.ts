export interface ProgressSubmission {
  submissionID: number;
  submissionCode: string;
  milestoneID: number;
  milestoneCode: string;
  ordinal: number | null;
  studentUserID: number;
  studentUserCode: string;
  studentProfileID: number | null;
  studentProfileCode: string | null;
  lecturerProfileID: number | null;
  lecturerCode: string | null;
  submittedAt: string;
  attemptNumber: number;
  lecturerComment: string | null;
  lecturerState: string | null;
  feedbackLevel: string | null;
  reportTitle: string;
  reportDescription: string;
  lastUpdated: string;
}

export interface ApiResponseProgressSubmissions {
  data: ProgressSubmission[];
}

export interface ProgressSubmissionUpdate {
  ordinal?: number | null;
  lecturerComment: string;
  lecturerState: string;
  feedbackLevel: string;
}
