export interface MilestoneTemplate {
  milestoneTemplateID: number;
  milestoneTemplateCode: string;
  name: string;
  description: string;
  ordinal: number;
  deadline: string;
  createdAt: string;
  lastUpdated: string | null;
}

export interface ApiResponseMilestoneTemplates {
  data: MilestoneTemplate[];
}
