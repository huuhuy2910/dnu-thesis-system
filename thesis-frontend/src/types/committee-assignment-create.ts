import type { TagSummary } from "./committee-assignment-common";
import type { CommitteeAssignmentMemberInput, CommitteeAssignmentSessionPayload, CommitteeAssignmentTopicPayload } from "./committee-assignment-requests";

export interface CommitteeAssignmentInitialization {
	committeeCode: string;
	availableRooms: string[];
	lecturers: CommitteeAssignmentAvailableLecturer[];
	tags: TagSummary[];
}

export interface CommitteeAssignmentAvailableLecturer {
	lecturerProfileId: number;
	lecturerCode: string;
	fullName: string;
	name: string;
	degree?: string | null;
	departmentCode?: string | null;
	specialties?: string | null;
	specialtyCode?: string | null;
	defenseQuota: number;
	currentDefenseLoad: number;
	availability: boolean;
	isEligibleChair?: boolean;
}

export interface CommitteeAssignmentAvailableTopic {
	topicCode: string;
	title: string;
	studentCode?: string | null;
	studentName?: string | null;
	supervisorCode?: string | null;
	supervisorName?: string | null;
	departmentCode?: string | null;
	specialtyCode?: string | null;
	tagCodes: string[];
	tagDescriptions?: string[];
	status?: string | null;
}

// New interfaces for multi-phase creation
export interface CommitteeCreateRequestDto {
	committeeCode?: string;
	name?: string;
	defenseDate?: Date;
	room?: string;
	tagCodes: string[];
	members: CommitteeAssignmentMemberInput[];
	sessions?: CommitteeAssignmentSessionPayload[];
	topics?: CommitteeAssignmentTopicPayload[];
}

export interface CommitteeMembersCreateRequestDto {
	committeeCode: string;
	members: CommitteeAssignmentMemberInput[];
}

export interface AssignTopicRequestDto {
	committeeCode: string;
	scheduledAt?: Date;
	session?: number;
	assignedBy?: string;
	items: AssignTopicItemDto[];
}

export interface AssignTopicItemDto {
	topicCode: string;
	session?: number;
	scheduledAt?: Date;
	startTime?: string;
	endTime?: string;
}

export interface AvailableLecturerDto {
	lecturerProfileId: number;
	lecturerCode: string;
	fullName: string;
	name: string;
	degree?: string | null;
	departmentCode?: string | null;
	specialties?: string | null;
	specialtyCode?: string | null;
	defenseQuota: number;
	currentDefenseLoad: number;
	availability: boolean;
	isEligibleChair?: boolean;
	tagCodes?: string[];
	tagNames?: string[];
}

export interface AvailableTopicDto {
	topicCode: string;
	title: string;
	studentCode?: string | null;
	studentName?: string | null;
	supervisorCode?: string | null;
	supervisorName?: string | null;
	departmentCode?: string | null;
	specialtyCode?: string | null;
	tags: string[];
	tagDescriptions?: string[];
	status?: string | null;
}

export interface CommitteeCreateInitDto {
	nextCode: string;
	defaultDefenseDate?: Date;
	rooms: string[];
	suggestedTags: TagSummary[];
}