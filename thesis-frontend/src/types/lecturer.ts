export interface LecturerProfile {
  lecturerProfileID: number;
  lecturerCode: string;
  userCode: string;
  departmentCode: string;
  degree: string;
  guideQuota: number;
  defenseQuota: number;
  currentGuidingCount: number;
  gender: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  profileImage: string;
  address: string;
  notes: string;
  fullName: string;
  createdAt: string;
  lastUpdated: string | null;
}

export interface ApiResponseLecturerProfile {
  data: LecturerProfile;
}

export interface User {
  userID: number;
  userCode: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  lastUpdated: string;
}

export interface ApiResponseUser {
  data: User;
}

export interface Milestone {
  milestoneID: number;
  milestoneCode: string;
  topicID: number;
  topicCode: string;
  milestoneTemplateCode: string;
  ordinal: number;
  deadline: string;
  state: string;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  lastUpdated: string;
}

export interface ApiResponseMilestones {
  data: Milestone[];
}
