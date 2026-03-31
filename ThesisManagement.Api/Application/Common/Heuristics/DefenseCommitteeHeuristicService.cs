using ThesisManagement.Api.DTOs.DefensePeriods;

namespace ThesisManagement.Api.Application.Common.Heuristics
{
    public sealed class LecturerHeuristicCandidate
    {
        public string LecturerCode { get; set; } = string.Empty;
        public HashSet<string> Tags { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public int Workload { get; set; }
        public int BusySlots { get; set; }
        public int ConsecutiveCommitteeAssignments { get; set; }
    }

    public sealed class LecturerHeuristicRank
    {
        public string LecturerCode { get; set; } = string.Empty;
        public decimal Score { get; set; }
    }

    public interface IDefenseCommitteeHeuristicService
    {
        IReadOnlyList<LecturerHeuristicRank> RankLecturers(
            IReadOnlyList<LecturerHeuristicCandidate> candidates,
            HashSet<string> desiredTags,
            GenerateCouncilHeuristicWeightsDto? requestWeights);
    }

    public sealed class DefenseCommitteeHeuristicService : IDefenseCommitteeHeuristicService
    {
        private readonly DefenseAutoGenerateHeuristicOptions _options;

        public DefenseCommitteeHeuristicService(Microsoft.Extensions.Options.IOptions<DefenseAutoGenerateHeuristicOptions> options)
        {
            _options = options.Value ?? new DefenseAutoGenerateHeuristicOptions();
        }

        public IReadOnlyList<LecturerHeuristicRank> RankLecturers(
            IReadOnlyList<LecturerHeuristicCandidate> candidates,
            HashSet<string> desiredTags,
            GenerateCouncilHeuristicWeightsDto? requestWeights)
        {
            if (candidates.Count == 0)
            {
                return Array.Empty<LecturerHeuristicRank>();
            }

            var tagWeight = requestWeights?.TagMatchWeight ?? _options.TagMatchWeight;
            var workloadWeight = requestWeights?.WorkloadWeight ?? _options.WorkloadWeight;
            var availabilityWeight = requestWeights?.AvailabilityWeight ?? _options.AvailabilityWeight;
            var fairnessWeight = requestWeights?.FairnessWeight ?? _options.FairnessWeight;
            var consecutivePenaltyWeight = requestWeights?.ConsecutiveCommitteePenaltyWeight ?? _options.ConsecutiveCommitteePenaltyWeight;

            var totalWeight = tagWeight + workloadWeight + availabilityWeight + fairnessWeight + consecutivePenaltyWeight;
            if (totalWeight <= 0)
            {
                tagWeight = _options.TagMatchWeight;
                workloadWeight = _options.WorkloadWeight;
                availabilityWeight = _options.AvailabilityWeight;
                fairnessWeight = _options.FairnessWeight;
                consecutivePenaltyWeight = _options.ConsecutiveCommitteePenaltyWeight;
                totalWeight = tagWeight + workloadWeight + availabilityWeight + fairnessWeight + consecutivePenaltyWeight;
            }

            tagWeight /= totalWeight;
            workloadWeight /= totalWeight;
            availabilityWeight /= totalWeight;
            fairnessWeight /= totalWeight;
            consecutivePenaltyWeight /= totalWeight;

            var maxWorkload = Math.Max(1, candidates.Max(x => x.Workload));
            var maxBusySlots = Math.Max(1, candidates.Max(x => x.BusySlots));
            var avgWorkload = candidates.Average(x => x.Workload);
            var maxConsecutiveAssignments = Math.Max(1, candidates.Max(x => x.ConsecutiveCommitteeAssignments));

            return candidates
                .Select(candidate => new LecturerHeuristicRank
                {
                    LecturerCode = candidate.LecturerCode,
                    Score = ComputeScore(
                        candidate,
                        desiredTags,
                        maxWorkload,
                        maxBusySlots,
                        avgWorkload,
                        maxConsecutiveAssignments,
                        tagWeight,
                        workloadWeight,
                        availabilityWeight,
                        fairnessWeight,
                        consecutivePenaltyWeight)
                })
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.LecturerCode, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static decimal ComputeScore(
            LecturerHeuristicCandidate candidate,
            HashSet<string> desiredTags,
            int maxWorkload,
            int maxBusySlots,
            double avgWorkload,
            int maxConsecutiveAssignments,
            decimal tagWeight,
            decimal workloadWeight,
            decimal availabilityWeight,
            decimal fairnessWeight,
            decimal consecutivePenaltyWeight)
        {
            decimal tagScore;
            if (desiredTags.Count == 0)
            {
                tagScore = 0.5m;
            }
            else
            {
                var matchedTags = candidate.Tags.Count(desiredTags.Contains);
                tagScore = (decimal)matchedTags / desiredTags.Count;
            }

            var workloadScore = 1m - (decimal)candidate.Workload / maxWorkload;
            var availabilityScore = 1m - (decimal)candidate.BusySlots / maxBusySlots;
            var fairnessScore = 1m - Math.Abs((decimal)avgWorkload - candidate.Workload) / maxWorkload;
            var consecutivePenaltyScore = 1m - (decimal)candidate.ConsecutiveCommitteeAssignments / maxConsecutiveAssignments;

            if (workloadScore < 0m) workloadScore = 0m;
            if (availabilityScore < 0m) availabilityScore = 0m;
            if (fairnessScore < 0m) fairnessScore = 0m;
            if (consecutivePenaltyScore < 0m) consecutivePenaltyScore = 0m;

            return (tagScore * tagWeight)
                + (workloadScore * workloadWeight)
                + (availabilityScore * availabilityWeight)
                + (fairnessScore * fairnessWeight)
                + (consecutivePenaltyScore * consecutivePenaltyWeight);
        }
    }
}
