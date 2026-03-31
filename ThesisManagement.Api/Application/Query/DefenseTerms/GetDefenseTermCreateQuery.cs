using ThesisManagement.Api.DTOs.DefenseTerms.Command;

namespace ThesisManagement.Api.Application.Query.DefenseTerms
{
    public interface IGetDefenseTermCreateQuery
    {
        DefenseTermCreateDto Execute();
    }

    public class GetDefenseTermCreateQuery : IGetDefenseTermCreateQuery
    {
        public DefenseTermCreateDto Execute()
            => new(
                Name: string.Empty,
                StartDate: DateTime.UtcNow,
                ConfigJson: null,
                Status: "Draft",
                CreatedAt: DateTime.UtcNow,
                LastUpdated: DateTime.UtcNow);
    }
}