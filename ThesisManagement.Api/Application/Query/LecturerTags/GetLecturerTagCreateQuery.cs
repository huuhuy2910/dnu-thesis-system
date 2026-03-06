using ThesisManagement.Api.DTOs.LecturerTags.Command;

namespace ThesisManagement.Api.Application.Query.LecturerTags
{
    public interface IGetLecturerTagCreateQuery
    {
        LecturerTagCreateDto Execute();
    }

    public class GetLecturerTagCreateQuery : IGetLecturerTagCreateQuery
    {
        public LecturerTagCreateDto Execute()
            => new(
                LecturerProfileID: 0,
                LecturerCode: null,
                TagID: 0,
                TagCode: null,
                AssignedAt: DateTime.UtcNow,
                AssignedByUserID: null,
                AssignedByUserCode: null
            );
    }
}
