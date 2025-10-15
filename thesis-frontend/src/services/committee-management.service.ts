import { committeeAssignmentApi } from "../api/committeeAssignmentApi";
import { fetchData } from "../api/fetchData";
import type { ApiResponse } from "../types/api";
import type {
	CommitteeAssignmentSummary,
	CommitteeMemberSummary,
	LecturerCommitteesDto,
	LecturerCommitteeItemDto,
	StudentDefenseInfoDto,
	StudentScheduleDto,
	StudentTopicDto,
} from "../types/committee";

export interface EligibleTopicSummary {
	topicCode: string;
	title: string;
	summary?: string | null;
	studentCode?: string | null;
	studentName?: string | null;
	supervisorLecturerCode?: string | null;
	supervisorName?: string | null;
	departmentCode?: string | null;
	specialtyCode?: string | null;
	specialtyName?: string | null;
	tagCodes: string[];
	tagDescriptions?: string[];
	status?: string | null;
	selectedSession?: number;
}

type EligibleTopicQuery = {
	search?: string;
	specialtyCode?: string;
	tagCode?: string;
};

const fallbackTopics: EligibleTopicSummary[] = [
	{
		topicCode: "TOP2025-UI-001",
		title: "Ứng dụng AI hỗ trợ Hội đồng bảo vệ luận văn",
		summary:
			"Đề xuất giải pháp giám sát và tổng hợp điểm bảo vệ theo thời gian thực dựa trên AI.",
		studentCode: "SV2025001",
		studentName: "Nguyễn Thị Mai",
		supervisorLecturerCode: "GV2024AI01",
		supervisorName: "TS. Trần Minh Hòa",
		specialtyCode: "AI",
		specialtyName: "Trí tuệ nhân tạo",
		tagCodes: ["AI", "Hệ thống"],
		status: "Đủ điều kiện",
	},
	{
		topicCode: "TOP2025-WEB-004",
		title: "Thiết kế nền tảng quản lý hội đồng bảo vệ",
		summary:
			"Xây dựng kiến trúc microservice cho hệ thống quản lý hội đồng và phân công đề tài.",
		studentCode: "SV2025008",
		studentName: "Lê Văn Tùng",
		supervisorLecturerCode: "GV2024WEB03",
		supervisorName: "ThS. Nguyễn Thu Hà",
		specialtyCode: "WEB",
		specialtyName: "Phát triển Web",
		tagCodes: ["Web", "Quản trị"],
		status: "Đủ điều kiện",
	},
	{
		topicCode: "TOP2025-SYS-012",
		title: "Tối ưu lịch bảo vệ với thuật toán di truyền",
		summary:
			"Áp dụng thuật toán di truyền để phân bố lịch bảo vệ đảm bảo công bằng và hạn chế xung đột.",
		studentCode: "SV2025042",
		studentName: "Phạm Gia Huy",
		supervisorLecturerCode: "GV2024SYS02",
		supervisorName: "PGS.TS Đỗ Thanh Nam",
		specialtyCode: "HQT",
		specialtyName: "Hệ thống thông tin",
		tagCodes: ["Thuật toán", "Lập lịch"],
		status: "Đủ điều kiện",
	},
];

export async function fetchEligibleTopicSummaries(
	query: EligibleTopicQuery = {},
	options?: { signal?: AbortSignal }
): Promise<EligibleTopicSummary[]> {
	try {
		const response = await committeeAssignmentApi.getAvailableTopics(
			{
				tag: query.tagCode,
				department: query.specialtyCode,
			},
			options
		);

		if (response?.success && Array.isArray(response.data)) {
			return response.data.map((topic) => ({
				topicCode: topic.topicCode,
				title: topic.title,
				studentCode: topic.studentCode ?? null,
				studentName: topic.studentName ?? null,
				summary: undefined,
				supervisorLecturerCode: topic.supervisorCode ?? null,
				supervisorName: topic.supervisorName ?? null,
				departmentCode: topic.departmentCode ?? null,
				specialtyCode: topic.specialtyCode ?? null,
				specialtyName: null,
				tagCodes: topic.tagCodes ?? [],
				tagDescriptions: topic.tagDescriptions ?? undefined,
				status: topic.status ?? null,
			}));
		}
	} catch (error) {
		// Intentionally swallow the error so the UI can fall back to curated data.
		console.warn("available-topics API not available, using fallback data", error);
	}

	return fallbackTopics;
}

export async function fetchEligibleTopicCount(
	options?: { signal?: AbortSignal }
): Promise<number> {
	try {
		const response = await fetchData<ApiResponse<unknown>>(
			"/Topics/get-list?status=%C4%90%E1%BB%A7%20%C4%91i%E1%BB%81u%20ki%E1%BB%87n%20b%E1%BA%A3o%20v%E1%BB%87&pageSize=1&page=1",
			{
				method: "GET",
				signal: options?.signal,
			}
		);

		if (typeof response?.totalCount === "number") {
			return response.totalCount;
		}
	} catch (error) {
		console.warn("Unable to query eligible topic count", error);
	}

	return fallbackTopics.length;
}

export async function refreshCommitteeList(options?: { signal?: AbortSignal }) {
	return committeeAssignmentApi.listCommittees(
		{ page: 1, pageSize: 200 },
		options
	);
}

export const wizardRoles = [
	{ value: "Chủ tịch", label: "Chủ tịch" },
	{ value: "Thư ký", label: "Thư ký" },
	{ value: "Ủy viên", label: "Ủy viên" },
	{ value: "Phản biện", label: "Phản biện" },
];

interface RawMemberResponse {
	committeeMemberId?: number;
	committeeMemberID?: number;
	lecturerCode?: string;
	lecturerName?: string;
	degree?: string | null;
	role?: string | null;
	isChair?: boolean;
	specialtyCodes?: string[] | null;
	specialtyNames?: string[] | null;
}

interface RawAssignmentResponse {
	topicCode?: string;
	title?: string;
	studentCode?: string | null;
	studentName?: string | null;
	supervisorLecturerCode?: string | null;
	supervisorName?: string | null;
	session?: number | null;
	scheduledAt?: string | null;
	startTime?: string | null;
	endTime?: string | null;
	room?: string | null;
	tagCodes?: string[] | null;
	specialtyCode?: string | null;
	specialtyName?: string | null;
}

interface RawLecturerCommitteeResponse {
	committeeCode?: string;
	name?: string | null;
	defenseDate?: string | null;
	room?: string | null;
	role?: string | null;
	isChair?: boolean;
	status?: string | null;
	tagCodes?: string[] | null;
	members?: RawMemberResponse[] | null;
	assignments?: RawAssignmentResponse[] | null;
}

interface RawLecturerCommitteesResponse {
	lecturerCode?: string;
	lecturerName?: string;
	committees?: RawLecturerCommitteeResponse[] | null;
}

interface RawScheduleTagResponse {
	tagCode?: string;
	tagName?: string | null;
}

interface RawStudentScheduleResponse {
	committeeCode?: string;
	committeeName?: string | null;
	room?: string | null;
	defenseDate?: string | null;
	session?: number | null;
	scheduledAt?: string | null;
	startTime?: string | null;
	endTime?: string | null;
	members?: RawMemberResponse[] | null;
	tags?: RawScheduleTagResponse[] | null;
}

interface RawStudentTopicResponse {
	topicCode?: string;
	title?: string;
	summary?: string | null;
	supervisorLecturerCode?: string | null;
	supervisorName?: string | null;
	specialtyCode?: string | null;
	specialtyName?: string | null;
}

interface RawStudentDefenseResponse {
	studentCode?: string;
	studentName?: string;
	topic?: RawStudentTopicResponse | null;
	schedule?: RawStudentScheduleResponse | null;
	tagCodes?: string[] | null;
}

const toStringArray = (value: string[] | null | undefined): string[] =>
	Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const mapMember = (payload: unknown): CommitteeMemberSummary => {
	const source = (payload ?? {}) as RawMemberResponse;
	return {
		committeeMemberId: Number(source.committeeMemberId ?? source.committeeMemberID ?? 0),
		lecturerCode: source.lecturerCode ?? "",
		lecturerName: source.lecturerName ?? "",
		degree: source.degree ?? null,
		role: source.role ?? "Thành viên",
		isChair: Boolean(source.isChair),
		specialtyCodes: toStringArray(source.specialtyCodes),
		specialtyNames: toStringArray(source.specialtyNames),
	};
};

const mapAssignment = (payload: unknown): CommitteeAssignmentSummary => {
	const source = (payload ?? {}) as RawAssignmentResponse;
	return {
		topicCode: source.topicCode ?? "",
		title: source.title ?? "",
		studentCode: source.studentCode ?? null,
		studentName: source.studentName ?? null,
		supervisorLecturerCode: source.supervisorLecturerCode ?? null,
		supervisorName: source.supervisorName ?? null,
		session: typeof source.session === "number" ? source.session : null,
		scheduledAt: source.scheduledAt ?? null,
		startTime: source.startTime ?? null,
		endTime: source.endTime ?? null,
		room: source.room ?? null,
		tagCodes: toStringArray(source.tagCodes),
		specialtyCode: source.specialtyCode ?? null,
		specialtyName: source.specialtyName ?? null,
	};
};

const mapLecturerCommittee = (payload: unknown): LecturerCommitteeItemDto => {
	const source = (payload ?? {}) as RawLecturerCommitteeResponse;
	return {
		committeeCode: source.committeeCode ?? "",
		name: source.name ?? null,
		defenseDate: source.defenseDate ?? null,
		room: source.room ?? null,
		role: source.role ?? "Thành viên",
		isChair: Boolean(source.isChair),
		status: source.status ?? "Đang chuẩn bị",
		tagCodes: toStringArray(source.tagCodes),
		members: Array.isArray(source.members) ? source.members.map(mapMember) : [],
		assignments: Array.isArray(source.assignments) ? source.assignments.map(mapAssignment) : [],
	};
};

const mapScheduleTag = (payload: unknown): { tagCode: string; tagName: string | null } => {
	const source = (payload ?? {}) as RawScheduleTagResponse;
	return {
		tagCode: source.tagCode ?? "",
		tagName: source.tagName ?? null,
	};
};

const fetchLecturerCommitteesInternal = async (
	lecturerCode: string,
	options?: { signal?: AbortSignal }
): Promise<LecturerCommitteesDto | null> => {
	if (!lecturerCode) return null;

	const result = await fetchData<ApiResponse<unknown>>(
		`/CommitteeAssignment/lecturer-committees/${encodeURIComponent(lecturerCode)}`,
		{ method: "GET", signal: options?.signal }
	);

		if (!result?.success) {
			throw new Error(result?.message || "Không thể tải danh sách hội đồng của giảng viên.");
		}

		if (!result.data) {
			return null;
		}

		const data = (result.data ?? {}) as RawLecturerCommitteesResponse;

		const committees: LecturerCommitteeItemDto[] = Array.isArray(data.committees)
			? data.committees.map(mapLecturerCommittee)
			: [];

	return {
		lecturerCode: data?.lecturerCode ?? lecturerCode,
		lecturerName: data?.lecturerName ?? lecturerCode,
		committees,
	};
};

const fetchStudentDefenseInfoInternal = async (
	studentCode: string,
	options?: { signal?: AbortSignal }
): Promise<StudentDefenseInfoDto | null> => {
	if (!studentCode) return null;

	const result = await fetchData<ApiResponse<unknown>>(
		`/CommitteeAssignment/student-defense/${encodeURIComponent(studentCode)}`,
		{ method: "GET", signal: options?.signal }
	);

		if (!result?.success) {
			throw new Error(result?.message || "Không thể tải thông tin bảo vệ của sinh viên.");
		}

		if (!result.data) {
			return null;
		}

		const data = (result.data ?? {}) as RawStudentDefenseResponse;

		const topicData = data.topic;
		const topic: StudentTopicDto | null = topicData
			? {
					topicCode: topicData.topicCode ?? "",
					title: topicData.title ?? "",
					summary: topicData.summary ?? null,
					supervisorLecturerCode: topicData.supervisorLecturerCode ?? null,
					supervisorName: topicData.supervisorName ?? null,
					specialtyCode: topicData.specialtyCode ?? null,
					specialtyName: topicData.specialtyName ?? null,
				}
			: null;

		const scheduleData = data.schedule;
		const schedule: StudentScheduleDto | null = scheduleData
			? {
					committeeCode: scheduleData.committeeCode ?? "",
					committeeName: scheduleData.committeeName ?? null,
					room: scheduleData.room ?? null,
					defenseDate: scheduleData.defenseDate ?? scheduleData.scheduledAt ?? null,
					session: typeof scheduleData.session === "number" ? scheduleData.session : null,
					scheduledAt: scheduleData.scheduledAt ?? null,
					startTime: scheduleData.startTime ?? null,
					endTime: scheduleData.endTime ?? null,
					members: Array.isArray(scheduleData.members)
						? scheduleData.members.map(mapMember)
						: [],
					tags: Array.isArray(scheduleData.tags)
						? scheduleData.tags.map(mapScheduleTag)
						: [],
				}
			: null;

	return {
			studentCode: data.studentCode ?? studentCode,
			studentName: data.studentName ?? studentCode,
		topic,
		schedule,
			tagCodes: toStringArray(data.tagCodes),
	};
};

export const committeeService = {
	eligibleTopicSummaries: fetchEligibleTopicSummaries,
	eligibleTopicCount: fetchEligibleTopicCount,
	refreshCommittees: refreshCommitteeList,
	lecturerCommittees: fetchLecturerCommitteesInternal,
	studentDefenseInfo: fetchStudentDefenseInfoInternal,
};
