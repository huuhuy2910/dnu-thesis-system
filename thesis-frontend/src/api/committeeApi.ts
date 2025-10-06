import axios from 'axios';

const API_BASE_URL = 'http://localhost:5257/api';

// Committee Management Types
export interface CreateCommitteeDto {
  committeeCode: string;
  name: string;
  defenseDate?: string; // ISO format
  room?: string;
}

export interface CommitteeMemberInput {
  lecturerProfileID: number;
  role: string; // "Chủ tịch", "Thư ký", "Phản biện"
}

export interface AddCommitteeMembersDto {
  committeeCode: string;
  members: CommitteeMemberInput[];
}

export interface CommitteeDetailDto {
  committeeCode: string;
  name: string;
  defenseDate?: string;
  room?: string;
  members: CommitteeMemberDetailDto[];
  assignedTopics: DefenseTopicDto[];
}

export interface CommitteeMemberDetailDto {
  committeeMemberID: number;
  lecturerCode: string;
  lecturerName: string;
  degree?: string;
  role: string;
  isChair: boolean;
}

export interface DefenseTopicDto {
  topicCode: string;
  title: string;
  studentCode?: string;
  studentName?: string;
  scheduledAt?: string;
}

export interface AvailableLecturerDto {
  lecturerProfileID: number;
  lecturerCode: string;
  fullName: string;
  degree?: string;
  departmentCode?: string;
  specialties?: string;
  currentDefenseCount: number;
  isEligibleForChair: boolean;
}

export interface LecturerCommitteesDto {
  lecturerCode: string;
  lecturerName: string;
  committees: LecturerCommitteeItemDto[];
}

export interface LecturerCommitteeItemDto {
  committeeCode: string;
  name: string;
  role: string;
  defenseDate?: string;
  room?: string;
  assignedTopics: DefenseTopicDto[];
}

export interface StudentDefenseInfoDto {
  studentCode: string;
  studentName: string;
  topic?: StudentTopicDto;
  committee?: StudentCommitteeDto;
  scheduledAt?: string;
}

export interface StudentTopicDto {
  topicCode: string;
  title: string;
  summary?: string;
}

export interface StudentCommitteeDto {
  committeeCode: string;
  name: string;
  defenseDate?: string;
  room?: string;
  members: CommitteeMemberDetailDto[];
}

// Defense Assignment Types
export interface TopicAssignmentDto {
  topicCode: string;
  scheduledAt: string; // ISO format
}

export interface AssignDefenseDto {
  committeeCode: string;
  topics: TopicAssignmentDto[];
}

export interface AvailableTopicDto {
  topicCode: string;
  title: string;
  summary?: string;
  proposerStudentCode?: string;
  studentName?: string;
  supervisorLecturerCode?: string;
  supervisorName?: string;
  departmentCode?: string;
  status: string;
}

export interface DefenseAssignmentDetailDto {
  assignmentCode: string;
  topicCode: string;
  topicTitle: string;
  committeeCode: string;
  committeeName: string;
  scheduledAt: string;
  room?: string;
  createdAt: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// API Functions
export const committeeManagementApi = {
  // Create Committee
  createCommittee: async (dto: CreateCommitteeDto, token: string): Promise<ApiResponse<string>> => {
    const response = await axios.post(
      `${API_BASE_URL}/CommitteeManagement/create`,
      dto,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Add Members
  addMembers: async (dto: AddCommitteeMembersDto, token: string): Promise<ApiResponse<boolean>> => {
    const response = await axios.post(
      `${API_BASE_URL}/CommitteeManagement/add-members`,
      dto,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get Committee Detail
  getCommitteeDetail: async (code: string, token: string): Promise<ApiResponse<CommitteeDetailDto>> => {
    const response = await axios.get(
      `${API_BASE_URL}/CommitteeManagement/get-detail/${code}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get Available Lecturers
  getAvailableLecturers: async (
    token: string,
    departmentCode?: string,
    specialtyCode?: string
  ): Promise<ApiResponse<AvailableLecturerDto[]>> => {
    const params = new URLSearchParams();
    if (departmentCode) params.append('departmentCode', departmentCode);
    if (specialtyCode) params.append('specialtyCode', specialtyCode);

    const response = await axios.get(
      `${API_BASE_URL}/CommitteeManagement/available-lecturers?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get Lecturer Committees
  getLecturerCommittees: async (lecturerCode: string, token: string): Promise<ApiResponse<LecturerCommitteesDto>> => {
    const response = await axios.get(
      `${API_BASE_URL}/CommitteeManagement/lecturer-committees/${lecturerCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get Student Defense Info
  getStudentDefenseInfo: async (studentCode: string, token: string): Promise<ApiResponse<StudentDefenseInfoDto>> => {
    const response = await axios.get(
      `${API_BASE_URL}/CommitteeManagement/student-defense/${studentCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};

export const defenseAssignmentApi = {
  // Get Available Topics
  getAvailableTopics: async (token: string): Promise<ApiResponse<AvailableTopicDto[]>> => {
    const response = await axios.get(
      `${API_BASE_URL}/DefenseAssignmentManagement/available-topics`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Assign Topics
  assignTopics: async (dto: AssignDefenseDto, token: string): Promise<ApiResponse<boolean>> => {
    const response = await axios.post(
      `${API_BASE_URL}/DefenseAssignmentManagement/assign`,
      dto,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get Committee Assignments
  getCommitteeAssignments: async (committeeCode: string, token: string): Promise<ApiResponse<DefenseAssignmentDetailDto[]>> => {
    const response = await axios.get(
      `${API_BASE_URL}/DefenseAssignmentManagement/committee-assignments/${committeeCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};
