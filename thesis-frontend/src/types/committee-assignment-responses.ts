import type { LecturerCommitteeItem } from "./committee-assignment-lecturer";

export interface LecturerCommitteesResponse {
	success: boolean;
	code: string | null;
	httpStatusCode: number;
	title: string | null;
	message: string | null;
	data: {
		lecturerCode: string;
		committees: LecturerCommitteeItem[];
	};
	totalCount: number;
	isRedirect: boolean;
	redirectUrl: string | null;
	errors: string | null;
}

export interface StudentDefenseInfoDto {
	studentCode: string;
	topicCode?: string;
	title?: string;
	committee?: {
		committeeCode: string;
		name: string;
		defenseDate?: string;
		room?: string;
		session?: number;
		startTime?: string;
		endTime?: string;
		members: {
			name: string;
			role: string;
		}[];
	};
}