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