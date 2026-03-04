using ThesisManagement.Api.DTOs.LecturerTags.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.LecturerTags
{
    public interface IGetLecturerTagUpdateQuery
    {
        Task<LecturerTagUpdateDto?> ExecuteAsync(int id);
    }

    public class GetLecturerTagUpdateQuery : IGetLecturerTagUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetLecturerTagUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<LecturerTagUpdateDto?> ExecuteAsync(int id)
        {
            var item = await _uow.LecturerTags.GetByIdAsync(id);
            if (item == null) return null;

            return new LecturerTagUpdateDto(
                item.LecturerProfileID,
                item.LecturerCode,
                item.TagID,
                item.TagCode,
                item.AssignedAt,
                item.AssignedByUserID,
                item.AssignedByUserCode);
        }
    }
}
