export interface PagedResult<T> {
	items: T[];
	totalCount: number;
}

export interface TagSummary {
	tagCode: string;
	tagName: string;
	description?: string | null;
	usageCount?: number;
}