export interface CommitteeAssignmentMemberInput {
	lecturerProfileId: number;
	role: string;
	isChair: boolean;
}

export interface CommitteeAssignmentTopicPayload {
	topicCode: string;
	session?: number;
	scheduledAt?: string | null;
	startTime?: string | null;
	endTime?: string | null;
}

export interface CommitteeAssignmentSessionPayload {
	session: number;
	topics: CommitteeAssignmentTopicPayload[];
}

export interface CommitteeAssignmentFilter {
	search?: string;
	committeeCode?: string;
	room?: string;
	defenseDate?: string; // ISO date string (yyyy-MM-dd)
	tagCodes?: string[];
	page?: number;
	pageSize?: number;
}

export interface CommitteeMembersUpdateRequestDto {
	committeeCode: string;
	members: CommitteeMemberRoleUpdateDto[];
}

export interface CommitteeMemberRoleUpdateDto {
	role: string;
	lecturerCode: string;
}

export interface CommitteeAssignmentCreateRequest {
	committeeCode: string;
	name?: string | null;
	defenseDate?: string | null;
	room?: string | null;
	tagCodes: string[];
	members: CommitteeAssignmentMemberInput[];
	sessions?: CommitteeAssignmentSessionPayload[];
	topics?: CommitteeAssignmentTopicPayload[];
}

export interface CommitteeAssignmentUpdateRequest {
	committeeCode: string;
	name?: string | null;
	defenseDate?: string | null;
	room?: string | null;
	tagCodes?: string[];
	members?: CommitteeAssignmentMemberInput[];
	topics?: CommitteeAssignmentTopicPayload[];
}