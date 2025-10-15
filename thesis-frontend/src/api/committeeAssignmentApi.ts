import { fetchData } from "./fetchData";
import type { ApiResponse } from "../types/api";

export interface PagedResult<T> {
	items: T[];
	totalCount: number;
}

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

export interface TagSummary {
	tagCode: string;
	tagName: string;
	description?: string | null;
	usageCount?: number;
}

export interface CommitteeAssignmentMemberInput {
	lecturerProfileId: number;
	role: string;
	isChair: boolean;
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

export interface CommitteeAssignmentUpdateRequest {
	committeeCode: string;
	name?: string | null;
	defenseDate?: string | null;
	room?: string | null;
	tagCodes?: string[];
	members?: CommitteeAssignmentMemberInput[];
	topics?: CommitteeAssignmentTopicPayload[];
}

export interface CommitteeMembersUpdateRequestDto {
	committeeCode: string;
	members: CommitteeMemberRoleUpdateDto[];
}

export interface CommitteeMemberRoleUpdateDto {
	role: string;
	lecturerCode: string;
}

export interface CommitteeAssignmentFilter {
	search?: string;
	committeeCode?: string;
	room?: string;
	defenseDate?: string; // ISO date string (yyyy-MM-dd)
	tagCode?: string;
	page?: number;
	pageSize?: number;
}

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
	specialtyCodes: string[];
	specialtyNames: string[];
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

export interface CommitteeAssignmentTopicSlot {
	topicCode: string;
	scheduledAt: string; // ISO datetime string
	session: number;
	startTime: string; // HH:mm:ss
	endTime: string; // HH:mm:ss
}

export interface CommitteeAssignmentAssignRequest {
	committeeCode: string;
	scheduledAt: string; // ISO date string for the session
	session: number;
	items: { topicCode: string; startTime?: string | null; endTime?: string | null }[];
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
	assigned: CommitteeAssignmentDefenseItem[];
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

function buildQueryString(filter?: CommitteeAssignmentFilter): string {
	if (!filter) return "";
	const params = new URLSearchParams();

	if (filter.search) params.set("search", filter.search);
	if (filter.committeeCode) params.set("committeeCode", filter.committeeCode);
	if (filter.room) params.set("room", filter.room);
	if (filter.defenseDate) params.set("defenseDate", filter.defenseDate);
	if (filter.tagCode) params.set("tagCode", filter.tagCode);
	if (typeof filter.page === "number") params.set("page", String(filter.page));
	if (typeof filter.pageSize === "number") params.set("pageSize", String(filter.pageSize));

	const query = params.toString();
	return query ? `?${query}` : "";
}

export const committeeAssignmentApi = {
	async getInitialization(options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentInitialization>> {
		return await fetchData<ApiResponse<CommitteeAssignmentInitialization>>("/CommitteeAssignment/get-create", {
			method: "GET",
			signal: options?.signal,
		});
	},

	async createCommittee(request: CommitteeAssignmentCreateRequest, options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentDetail>> {
		return await fetchData<ApiResponse<CommitteeAssignmentDetail>>("/CommitteeAssignment/create", {
			method: "POST",
			body: request,
			signal: options?.signal,
		});
	},

	async updateCommittee(
		committeeCode: string,
		request: CommitteeAssignmentUpdateRequest,
		options?: { signal?: AbortSignal }
	): Promise<ApiResponse<CommitteeAssignmentDetail>> {
		return await fetchData<ApiResponse<CommitteeAssignmentDetail>>(`/CommitteeAssignment/update/${encodeURIComponent(committeeCode)}`, {
			method: "PUT",
			body: request,
			signal: options?.signal,
		});
	},

	async listCommittees(filter?: CommitteeAssignmentFilter, options?: { signal?: AbortSignal }): Promise<ApiResponse<PagedResult<CommitteeAssignmentListItem>>> {
		const query = buildQueryString(filter);
		return await fetchData<ApiResponse<PagedResult<CommitteeAssignmentListItem>>>(
			`/CommitteeAssignment/committees${query}`,
			{
				method: "GET",
				signal: options?.signal,
			}
		);
	},

	async getCommitteeDetail(committeeCode: string, options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentDetail>> {
		return await fetchData<ApiResponse<CommitteeAssignmentDetail>>(
			`/CommitteeAssignment/get-detail/${encodeURIComponent(committeeCode)}`,
			{
				method: "GET",
				signal: options?.signal,
			}
		);
	},

	async updateCommitteeMembers(request: CommitteeMembersUpdateRequestDto, options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentDetail>> {
		return await fetchData<ApiResponse<CommitteeAssignmentDetail>>(
			`/CommitteeAssignment/update-members/${encodeURIComponent(request.committeeCode)}`,
			{
				method: "PUT",
				body: request,
				signal: options?.signal,
			}
		);
	},

	async assignTopics(request: CommitteeAssignmentAssignRequest, options?: { signal?: AbortSignal }): Promise<ApiResponse<boolean>> {
		// backend expects AssignTopicRequestDto: { committeeCode, scheduledAt, session, items: [{topicCode, startTime, endTime}] }
		const payload = {
			committeeCode: request.committeeCode,
			scheduledAt: request.scheduledAt,
			session: request.session,
			items: request.items.map(i => ({ topicCode: i.topicCode, startTime: i.startTime ?? null, endTime: i.endTime ?? null }))
		};
		return await fetchData<ApiResponse<boolean>>("/CommitteeAssignment/assign", {
			method: "POST",
			body: payload,
			signal: options?.signal,
		});
	},

	async autoAssignTopics(request: CommitteeAssignmentAutoAssignRequest, options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentAutoAssignResult>> {
		return await fetchData<ApiResponse<CommitteeAssignmentAutoAssignResult>>("/CommitteeAssignment/auto-assign", {
			method: "POST",
			body: request,
			signal: options?.signal,
		});
	},

	async changeAssignment(request: CommitteeAssignmentChangeRequest, options?: { signal?: AbortSignal }): Promise<ApiResponse<boolean>> {
		// ensure committeeCode included in payload because backend expects it
		const payload = {
			committeeCode: request.committeeCode,
			topicCode: request.topicCode,
			scheduledAt: request.scheduledAt,
			session: request.session,
			startTime: request.startTime ?? null,
			endTime: request.endTime ?? null
		};
		return await fetchData<ApiResponse<boolean>>("/CommitteeAssignment/change-assignment", {
			method: "PUT",
			body: payload,
			signal: options?.signal,
		});
	},

	async removeAssignment(topicCode: string, options?: { signal?: AbortSignal }): Promise<ApiResponse<boolean>> {
		return await fetchData<ApiResponse<boolean>>(
			`/CommitteeAssignment/remove-assignment/${encodeURIComponent(topicCode)}`,
			{
				method: "DELETE",
				signal: options?.signal,
			}
		);
	},

	async getAvailableTopics(filter?: { tag?: string; department?: string }, options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentAvailableTopic[]>> {
		const params = new URLSearchParams();
		if (filter?.tag) params.set("tag", filter.tag);
		if (filter?.department) params.set("department", filter.department);
		const query = params.toString();
		return await fetchData<ApiResponse<CommitteeAssignmentAvailableTopic[]>>(
			`/CommitteeAssignment/available-topics${query ? `?${query}` : ""}`,
			{
				method: "GET",
				signal: options?.signal,
			}
		);
	},

	async getTags(options?: { signal?: AbortSignal }): Promise<ApiResponse<TagSummary[]>> {
		return await fetchData<ApiResponse<TagSummary[]>>("/CommitteeAssignment/tags", {
			method: "GET",
			signal: options?.signal,
		});
	},

	async getAvailableLecturers(filter?: { tag?: string }, options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentAvailableLecturer[]>> {
		const params = new URLSearchParams();
		if (filter?.tag) params.append("tag", filter.tag);
		const query = params.toString();
		const url = query ? `/CommitteeAssignment/available-lecturers?${query}` : "/CommitteeAssignment/available-lecturers";
		return await fetchData<ApiResponse<CommitteeAssignmentAvailableLecturer[]>>(url, {
			method: "GET",
			signal: options?.signal,
		});
	},

	async deleteCommittee(committeeCode: string, force = true, options?: { signal?: AbortSignal }): Promise<ApiResponse<boolean>> {
		const suffix = force ? "?force=true" : "";
		return await fetchData<ApiResponse<boolean>>(
			`/CommitteeAssignment/delete/${encodeURIComponent(committeeCode)}${suffix}`,
			{
				method: "DELETE",
				signal: options?.signal,
			}
		);
	},

	async getLecturerCommittees(lecturerCode: string, options?: { signal?: AbortSignal }): Promise<ApiResponse<{ lecturerCode: string; committees: LecturerCommitteeItem[] }>> {
		return await fetchData<ApiResponse<{ lecturerCode: string; committees: LecturerCommitteeItem[] }>>(
			`/CommitteeAssignment/lecturer-committees/${encodeURIComponent(lecturerCode)}`,
			{
				method: "GET",
				signal: options?.signal,
			}
		);
	},

	async getStudentDefense(studentCode: string, options?: { signal?: AbortSignal }): Promise<ApiResponse<StudentDefenseInfoDto>> {
		return await fetchData<ApiResponse<StudentDefenseInfoDto>>(
			`/CommitteeAssignment/student-defense/${encodeURIComponent(studentCode)}`,
			{
				method: "GET",
				signal: options?.signal,
			}
		);
	},
};

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

// New functions
export async function getCommitteeCreateInit(options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeCreateInitDto>> {
	return await fetchData<ApiResponse<CommitteeCreateInitDto>>("/CommitteeAssignment/get-create", {
		method: "GET",
		signal: options?.signal,
	});
}

export async function createCommittee(request: CommitteeCreateRequestDto, options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentDetail>> {
	return await fetchData<ApiResponse<CommitteeAssignmentDetail>>("/CommitteeAssignment/create", {
		method: "POST",
		body: request,
		signal: options?.signal,
	});
}

export async function getAvailableLecturers(filter?: { tag?: string }, options?: { signal?: AbortSignal }): Promise<ApiResponse<AvailableLecturerDto[]>> {
	const params = new URLSearchParams();
	if (filter?.tag) params.set("tag", filter.tag);
	const query = params.toString();
	return await fetchData<ApiResponse<AvailableLecturerDto[]>>(`/CommitteeAssignment/available-lecturers${query ? `?${query}` : ""}`, {
		method: "GET",
		signal: options?.signal,
	});
}

export async function saveCommitteeMembers(request: CommitteeMembersCreateRequestDto, options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentDetail>> {
	return await fetchData<ApiResponse<CommitteeAssignmentDetail>>("/CommitteeAssignment/members", {
		method: "POST",
		body: request,
		signal: options?.signal,
	});
}

export async function getAvailableTopics(filter?: { tag?: string; department?: string; committeeCode?: string }, options?: { signal?: AbortSignal }): Promise<ApiResponse<AvailableTopicDto[]>> {
	const params = new URLSearchParams();
	if (filter?.tag) params.set("tag", filter.tag);
	if (filter?.department) params.set("department", filter.department);
	if (filter?.committeeCode) params.set("committeeCode", filter.committeeCode);
	const query = params.toString();
	return await fetchData<ApiResponse<AvailableTopicDto[]>>(`/CommitteeAssignment/available-topics${query ? `?${query}` : ""}`, {
		method: "GET",
		signal: options?.signal,
	});
}

export async function assignTopics(request: AssignTopicRequestDto, options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentDetail>> {
	return await fetchData<ApiResponse<CommitteeAssignmentDetail>>("/CommitteeAssignment/assign", {
		method: "POST",
		body: request,
		signal: options?.signal,
	});
}

export type CommitteeAssignmentApi = typeof committeeAssignmentApi;
