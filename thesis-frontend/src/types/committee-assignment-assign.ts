export interface CommitteeAssignmentTopicSlot {
	topicCode: string;
	scheduledAt?: string | null; // ISO datetime string or null
	session: number;
	startTime: string; // HH:mm:ss
	endTime: string; // HH:mm:ss
}

export interface CommitteeAssignmentAssignRequest {
	committeeCode: string;
	scheduledAt?: string | null; // ISO date string for the session or null
	session: number;
	items: { topicCode: string; session?: number; scheduledAt?: string | null; startTime?: string | null; endTime?: string | null }[];
	// items now include session and scheduledAt so backend receives full info in a single array
	assignedBy?: string;
}

export interface CommitteeAssignmentAutoAssignRequest {
	committeeCodes: string[];
	slotMinutes?: number;
}

export interface CommitteeAssignmentAutoAssignResult {
	committees: CommitteeAssignmentAutoAssignCommittee[];
}

export interface CommitteeAssignmentAutoAssignCommittee {
	committeeCode: string;
	assignedCount: number;
	assigned: import("./committee-assignment-core").CommitteeAssignmentDefenseItem[];
	skippedTopics: string[];
}

export interface CommitteeAssignmentChangeRequest {
	committeeCode: string;
	topicCode: string;
	scheduledAt: string; // ISO datetime string
	session: number;
	startTime?: string; // HH:mm:ss
	endTime?: string; // HH:mm:ss
}