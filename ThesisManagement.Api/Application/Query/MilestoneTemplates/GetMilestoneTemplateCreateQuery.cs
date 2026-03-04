using ThesisManagement.Api.DTOs.MilestoneTemplates.Command;

namespace ThesisManagement.Api.Application.Query.MilestoneTemplates
{
    public interface IGetMilestoneTemplateCreateQuery
    {
        MilestoneTemplateCreateDto Execute();
    }

    public class GetMilestoneTemplateCreateQuery : IGetMilestoneTemplateCreateQuery
    {
        public MilestoneTemplateCreateDto Execute() => new(string.Empty, string.Empty, null, 1);
    }
}
