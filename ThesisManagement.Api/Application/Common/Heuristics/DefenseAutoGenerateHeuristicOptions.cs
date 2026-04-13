namespace ThesisManagement.Api.Application.Common.Heuristics
{
    public sealed class DefenseAutoGenerateHeuristicOptions
    {
        public decimal TagMatchWeight { get; set; } = 0.50m;
        public decimal WorkloadWeight { get; set; } = 0.20m;
        public decimal FairnessWeight { get; set; } = 0.15m;
        public decimal ConsecutiveCommitteePenaltyWeight { get; set; } = 0.20m;
    }
}
