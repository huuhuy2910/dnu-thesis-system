namespace ThesisManagement.Api.Models
{
    public enum CommitteeStatus
    {
        Draft = 0,
        Ready = 1,
        Ongoing = 2,
        Completed = 3,
        Finalized = 4,
        Published = 5
    }

    public enum AssignmentStatus
    {
        Pending = 0,
        Defending = 1,
        Graded = 2,
        RevisionRequired = 3,
        Approved = 4,
        Rejected = 5
    }

    public enum ScoreStatus
    {
        Draft = 0,
        Submitted = 1,
        Locked = 2
    }

    public enum RevisionStatus
    {
        Draft = 0,
        Submitted = 1,
        Approved = 2,
        Rejected = 3
    }
}
