import type { SubmissionFile } from "./submissionFile";

export interface Report {
  submissionID: number;
  submissionCode: string;
  milestoneID: number;
  milestoneCode: string;
  studentUserID: number;
  studentUserCode: string;
  studentProfileID: number;
  studentProfileCode: string;
  submittedAt: string;
  attemptNumber: number;
  lecturerComment?: string;
  lecturerState?: string;
  feedbackLevel?: string;
  reportTitle: string;
  reportDescription: string;
  lastUpdated: string;
  files: SubmissionFile[];
}
