export interface MilestoneStateHistory {
  historyID: number;
  milestoneID: number;
  milestoneCode: string;
  topicCode: string;
  oldState: string | null;
  newState: string;
  changedByUserCode: string;
  changedByUserID: number;
  changedAt: string;
  comment: string;
}

export interface ApiResponseMilestoneStateHistories {
  data: MilestoneStateHistory[];
}
