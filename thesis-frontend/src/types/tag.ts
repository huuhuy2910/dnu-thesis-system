export interface Tag {
  tagID: number;
  tagCode: string;
  tagName: string;
  description: string;
  createdAt: string;
}

export interface LecturerTag {
  lecturerTagID: number;
  lecturerProfileID: number;
  lecturerCode: string;
  tagID: number;
  tagCode: string;
  assignedAt: string;
  assignedByUserID: number | null;
  assignedByUserCode: string | null;
}

export interface CatalogTopicTag {
  catalogTopicID: number;
  tagID: number;
  catalogTopicCode: string;
  tagCode: string;
  createdAt: string;
}

export interface TopicTag {
  topicTagID: number;
  tagID: number;
  tagCode: string;
  catalogTopicCode: string | null;
  topicCode: string;
  createdAt: string;
}

export interface ApiResponseTags {
  data: Tag[];
}

export interface ApiResponseLecturerTags {
  data: LecturerTag[];
}

export interface ApiResponseCatalogTopicTags {
  data: CatalogTopicTag[];
}

export interface ApiResponseTopicTags {
  data: TopicTag[];
}
