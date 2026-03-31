namespace ThesisManagement.Api.Application.Command.DefensePeriods.Services
{
    public sealed class DefenseRevisionQuorumOptions
    {
        public int MinimumApprovals { get; set; } = 3;
        public bool RequireChairApproval { get; set; } = true;
        public bool RequireSecretaryApproval { get; set; } = true;
        public bool RequireSupervisorApproval { get; set; } = true;
        public bool RejectAsVeto { get; set; } = true;
    }
}
