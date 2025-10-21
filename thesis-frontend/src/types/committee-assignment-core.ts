import type { TagSummary } from "./committee-assignment-common";

export interface CommitteeAssignmentListItem {
  committeeCode: string;
  name?: string | null;
  defenseDate?: string | null;
  room?: string | null;
  memberCount: number;
  topicCount: number;
  tagCodes: string[];
  createdAt: string;
  lastUpdated: string;
  status?: string | null;
}

export interface CommitteeAssignmentDetail {
  committeeCode: string;
  name?: string | null;
  defenseDate?: string | null;
  room?: string | null;
  status?: string | null;
  tags: TagSummary[];
  members: CommitteeAssignmentMemberDetail[];
  assignments: CommitteeAssignmentDefenseItem[];
  sessions: CommitteeSessionDto[];
}

export interface CommitteeAssignmentMemberDetail {
  lecturerProfileId: number;
  lecturerCode: string;
  fullName: string;
  role: string;
  isChair: boolean;
  degree?: string | null;
  tagCodes: string[];
  tagNames: string[];
}

export interface CommitteeAssignmentDefenseItem {
  assignmentCode?: string;
  topicCode: string;
  title: string;
  studentCode?: string | null;
  studentName?: string | null;
  supervisorCode?: string | null;
  supervisorName?: string | null;
  session?: number | null;
  scheduledAt?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
  tagCodes: string[];
  status?: string | null;
}

export interface CommitteeSessionDto {
  session: number;
  topics: CommitteeSessionTopicDto[];
}

export interface CommitteeSessionTopicDto {
  assignmentCode: string;
  topicCode: string;
  title: string;
  studentCode?: string | null;
  studentName?: string | null;
  supervisorCode?: string | null;
  supervisorName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}
