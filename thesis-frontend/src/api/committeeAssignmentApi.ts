import { fetchData } from "./fetchData";
import type { ApiResponse } from "../types/api";
import type {
	PagedResult,
	CommitteeAssignmentInitialization,
	CommitteeAssignmentAvailableLecturer,
	TagSummary,
	CommitteeAssignmentCreateRequest,
	CommitteeAssignmentUpdateRequest,
	CommitteeMembersUpdateRequestDto,
	CommitteeAssignmentFilter,
	CommitteeAssignmentListItem,
	CommitteeAssignmentDetail,
	CommitteeAssignmentAssignRequest,
	CommitteeAssignmentAutoAssignRequest,
	CommitteeAssignmentAutoAssignResult,
	CommitteeAssignmentChangeRequest,
	StudentDefenseInfoDto,
	CommitteeAssignmentAvailableTopic,
	LecturerCommitteeItem,
	CommitteeCreateRequestDto,
	CommitteeMembersCreateRequestDto,
	AssignTopicRequestDto,
	AvailableLecturerDto,
	AvailableTopicDto,
	CommitteeCreateInitDto,
} from "../types/committee-assignment";

function buildQueryString(filter?: CommitteeAssignmentFilter): string {
	if (!filter) return "";
	const params = new URLSearchParams();

	if (filter.search) params.set("keyword", filter.search);
	if (filter.committeeCode) params.set("committeeCode", filter.committeeCode);
	if (filter.room) params.set("room", filter.room);
	if (filter.defenseDate) params.set("date", filter.defenseDate);
	if (filter.tagCodes && filter.tagCodes.length > 0) {
		filter.tagCodes.forEach(code => params.append("tags", code));
	}
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
		// Build a strict payload matching the backend contract: top-level committeeCode, scheduledAt, session, assignedBy?, items[]
		const payload = {
			committeeCode: request.committeeCode,
			scheduledAt: request.scheduledAt,
			session: request.session,
			assignedBy: request.assignedBy,
			items: (request.items || []).map(i => ({
				topicCode: i.topicCode,
				session: i.session ?? request.session,
				scheduledAt: i.scheduledAt ?? request.scheduledAt ?? null,
				startTime: i.startTime ?? null,
				endTime: i.endTime ?? null,
			})),
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

	async getAvailableLecturers(filter?: { tag?: string; committeeCode?: string }, options?: { signal?: AbortSignal }): Promise<ApiResponse<CommitteeAssignmentAvailableLecturer[]>> {
			const params = new URLSearchParams();
			if (filter?.tag) params.append("tag", filter.tag);
			if (filter?.committeeCode) params.append("committeeCode", filter.committeeCode);
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

export async function getAvailableLecturers(filter?: { tag?: string; committeeCode?: string }, options?: { signal?: AbortSignal }): Promise<ApiResponse<AvailableLecturerDto[]>> {
	const params = new URLSearchParams();
	if (filter?.tag) params.set("tag", filter.tag);
	if (filter?.committeeCode) params.set("committeeCode", filter.committeeCode);
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
	// Ensure exported helper also sends the full items[] shape
	const payload = {
		committeeCode: request.committeeCode,
		scheduledAt: request.scheduledAt,
		session: request.session,
		assignedBy: (request as any).assignedBy,
		items: (request as any).items?.map((i: any) => ({
			topicCode: i.topicCode,
			session: i.session ?? request.session,
			scheduledAt: i.scheduledAt ?? request.scheduledAt ?? null,
			startTime: i.startTime ?? null,
			endTime: i.endTime ?? null,
		})) ?? []
	};
	return await fetchData<ApiResponse<CommitteeAssignmentDetail>>("/CommitteeAssignment/assign", {
		method: "POST",
		body: payload,
		signal: options?.signal,
	});
}

export type CommitteeAssignmentApi = typeof committeeAssignmentApi;
