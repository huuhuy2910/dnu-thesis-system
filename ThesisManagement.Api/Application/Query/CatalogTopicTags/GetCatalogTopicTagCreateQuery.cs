using ThesisManagement.Api.DTOs.CatalogTopicTags.Command;

namespace ThesisManagement.Api.Application.Query.CatalogTopicTags
{
    public interface IGetCatalogTopicTagCreateQuery
    {
        CatalogTopicTagCreateDto Execute();
    }

    public class GetCatalogTopicTagCreateQuery : IGetCatalogTopicTagCreateQuery
    {
        public CatalogTopicTagCreateDto Execute() => new(null, null, null, null);
    }
}
