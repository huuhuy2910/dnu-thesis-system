using ThesisManagement.Api.DTOs.Tags.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Tags
{
    public interface IGetTagUpdateQuery
    {
        Task<TagUpdateDto?> ExecuteAsync(int id);
    }

    public class GetTagUpdateQuery : IGetTagUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetTagUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<TagUpdateDto?> ExecuteAsync(int id)
        {
            var item = await _uow.Tags.GetByIdAsync(id);
            return item == null ? null : new TagUpdateDto(item.TagName, item.Description);
        }
    }
}
