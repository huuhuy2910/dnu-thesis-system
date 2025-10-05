export interface Topic {
  topicID: number;
  topicCode: string;
  title: string;
  summary: string;
  type: string;
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
  specialtyID: number | null;
  specialtyCode: string | null;
}
