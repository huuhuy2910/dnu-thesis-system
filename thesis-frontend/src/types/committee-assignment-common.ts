export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface TagSummary {
  tagID?: number;
  tagCode: string;
  tagName: string;
  description?: string | null;
  createdAt?: string;
  usageCount?: number;
}
