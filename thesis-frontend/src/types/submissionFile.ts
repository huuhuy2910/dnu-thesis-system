export interface SubmissionFile {
  fileID: number;
  submissionID: number;
  submissionCode: string;
  fileURL: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  uploadedByUserCode: string;
  uploadedByUserID: number;
}
