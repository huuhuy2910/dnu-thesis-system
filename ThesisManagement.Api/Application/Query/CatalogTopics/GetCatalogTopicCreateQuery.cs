namespace ThesisManagement.Api.Application.Query.CatalogTopics
{
    public interface IGetCatalogTopicCreateQuery
    {
        object Execute();
    }

    public class GetCatalogTopicCreateQuery : IGetCatalogTopicCreateQuery
    {
        public object Execute() => new { Title = "", Summary = "", Tags = "", AssignedStatus = "", AssignedAt = (DateTime?)null };
    }
}
