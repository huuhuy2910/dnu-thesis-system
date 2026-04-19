using ThesisManagement.Api.DTOs.TopicRenameRequests.Query;

namespace ThesisManagement.Api.Services.TopicRenameRequests
{
    public interface ITopicRenameDocumentService
    {
        Task<byte[]> BuildTemplateAsync(TopicRenameTemplateDataDto data, CancellationToken cancellationToken = default);
    }
}