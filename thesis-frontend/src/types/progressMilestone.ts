export interface ProgressMilestone {
  milestoneID: number;
  milestoneCode: string;
  topicID: number;
  topicCode: string;
  milestoneTemplateCode: string;
  ordinal: number;
  deadline: string;
  state: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  lastUpdated: string;
}

export interface ApiResponseProgressMilestones {
  data: ProgressMilestone[];
}
