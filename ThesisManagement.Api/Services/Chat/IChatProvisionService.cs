using ThesisManagement.Api.Models;

namespace ThesisManagement.Api.Services.Chat
{
    public interface IChatProvisionService
    {
        Task EnsureForAcceptedTopicAsync(Topic topic);
    }
}
