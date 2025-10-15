export interface CommitteeMemberSummary {
	committeeMemberId: number;
	lecturerCode: string;
	lecturerName: string;
	degree?: string | null;
	role: string;
	isChair: boolean;
	specialtyCodes?: string[];
	specialtyNames?: string[];
}

export interface CommitteeAssignmentSummary {
	topicCode: string;
	title: string;
	studentCode?: string | null;
	studentName?: string | null;
	supervisorLecturerCode?: string | null;
	supervisorName?: string | null;
	session?: number | null;
	scheduledAt?: string | null;
	startTime?: string | null;
	endTime?: string | null;
	room?: string | null;
	tagCodes: string[];
	specialtyCode?: string | null;
	specialtyName?: string | null;
}

export interface LecturerCommitteeItemDto {
	committeeCode: string;
	name?: string | null;
	defenseDate?: string | null;
	room?: string | null;
	role: string;
	isChair: boolean;
	status?: string | null;
	tagCodes: string[];
	members: CommitteeMemberSummary[];
	assignments: CommitteeAssignmentSummary[];
}

export interface LecturerCommitteesDto {
	lecturerCode: string;
	lecturerName: string;
	committees: LecturerCommitteeItemDto[];
}

export interface StudentTopicDto {
	topicCode: string;
	title: string;
	summary?: string | null;
	supervisorLecturerCode?: string | null;
	supervisorName?: string | null;
	specialtyCode?: string | null;
	specialtyName?: string | null;
}

export interface StudentScheduleDto {
	committeeCode: string;
	committeeName?: string | null;
	room?: string | null;
	defenseDate?: string | null;
	session?: number | null;
	scheduledAt?: string | null;
	startTime?: string | null;
	endTime?: string | null;
	members: CommitteeMemberSummary[];
	tags: { tagCode: string; tagName?: string | null }[];
}

export interface StudentDefenseInfoDto {
	studentCode: string;
	studentName: string;
	topic?: StudentTopicDto | null;
	schedule?: StudentScheduleDto | null;
	tagCodes: string[];
}
