import type { TagSummary } from "./committee-assignment-common";
import type { CommitteeAssignmentMemberDetail, CommitteeAssignmentDefenseItem, CommitteeSessionDto } from "./committee-assignment-core";

export interface LecturerCommitteeItem {
	committeeCode: string;
	name?: string | null;
	defenseDate?: string | null;
	room?: string | null;
	status?: string | null;
	tags?: TagSummary[];
	members?: CommitteeAssignmentMemberDetail[];
	assignments?: CommitteeAssignmentDefenseItem[];
	sessions?: CommitteeSessionDto[];
}