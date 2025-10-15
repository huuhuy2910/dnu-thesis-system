export interface ProgressMilestone {
  milestoneID: number;
  milestoneCode: string;
  topicID: number;
  topicCode: string;
  milestoneTemplateCode: string | null;
  ordinal: number | null;
  deadline: string | null;
  state: string;
  startedAt: string | null;
  completedAt1: string | null;
  completedAt2: string | null;
  completedAt3: string | null;
  completedAt4: string | null;
  completedAt5: string | null;
  createdAt: string;
  lastUpdated: string;
}

export interface ApiResponseProgressMilestones {
  data: ProgressMilestone[];
}
