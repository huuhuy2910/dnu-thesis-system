namespace ThesisManagement.Api.DTOs.DefensePeriods
{
    public class DefensePeriodDashboardDto
    {
        public int DefenseTermId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = string.Empty;

        public bool LecturerCapabilitiesLocked { get; set; }
        public bool CouncilConfigConfirmed { get; set; }
        public bool Finalized { get; set; }
        public bool ScoresPublished { get; set; }

        public int EligibleStudentCount { get; set; }
        public int EligibleSupervisorCount { get; set; }
        public int AssignedStudentCount { get; set; }
        public int AssignedSupervisorCount { get; set; }
        public int AssignedTopicCount { get; set; }

        public int CapabilityLecturerCount { get; set; }
        public int CommitteeLecturerCount { get; set; }

        public int CouncilCount { get; set; }
        public int AssignmentCount { get; set; }
        public int ResultCount { get; set; }
        public int RevisionCount { get; set; }

        public decimal AssignmentCoveragePercent { get; set; }

        public List<string> AllowedActions { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    public class DefensePeriodStudentParticipantDto
    {
        public string StudentCode { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string? TopicCode { get; set; }
        public string TopicTitle { get; set; } = string.Empty;
        public string? SupervisorCode { get; set; }
        public List<string> Tags { get; set; } = new();
        public int? CommitteeId { get; set; }
        public string? CommitteeCode { get; set; }
        public int? AssignmentId { get; set; }
        public string Source { get; set; } = string.Empty;
        public bool IsEligible { get; set; }
        public bool Valid { get; set; }
        public string? Error { get; set; }
    }

    public class DefensePeriodLecturerParticipantDto
    {
        public string LecturerCode { get; set; } = string.Empty;
        public string LecturerName { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public bool IsInCapabilityPool { get; set; }
        public bool IsSupervisor { get; set; }
        public bool IsCommitteeMember { get; set; }
        public int GuidedTopicCount { get; set; }
        public int CommitteeCount { get; set; }
        public List<string> CommitteeRoles { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    public class DefensePeriodWorkflowStepDto
    {
        public string StepKey { get; set; } = string.Empty;
        public string StepName { get; set; } = string.Empty;
        public bool Completed { get; set; }
        public bool Enabled { get; set; }
        public string? BlockedReason { get; set; }
    }

    public class DefensePeriodWorkflowSnapshotDto
    {
        public int DefenseTermId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int CompletionPercent { get; set; }
        public List<string> AllowedActions { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
        public List<DefensePeriodWorkflowStepDto> Steps { get; set; } = new();
    }
}