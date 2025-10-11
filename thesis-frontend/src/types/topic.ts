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

export interface ApiResponseTopics {
  data: Topic[];
}

export interface TopicFormData {
  topicCode?: string; // Auto generated from API template
  title: string;
  summary: string;
  type: "CATALOG" | "SELF";
  catalogTopicID: number | null;
  supervisorLecturerProfileID: number | null;
  departmentID: number | null;
  specialtyID: number | null;
  status?: string; // Auto set to "Đang chờ"
}
