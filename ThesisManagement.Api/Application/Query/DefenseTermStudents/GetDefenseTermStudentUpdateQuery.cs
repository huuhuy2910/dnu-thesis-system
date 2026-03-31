using ThesisManagement.Api.DTOs.DefenseTermStudents.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.DefenseTermStudents
{
    public interface IGetDefenseTermStudentUpdateQuery
    {
        Task<DefenseTermStudentUpdateDto?> ExecuteAsync(int id);
    }

    public class GetDefenseTermStudentUpdateQuery : IGetDefenseTermStudentUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetDefenseTermStudentUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<DefenseTermStudentUpdateDto?> ExecuteAsync(int id)
        {
            var item = await _uow.DefenseTermStudents.GetByIdAsync(id);
            if (item == null) return null;

            return new DefenseTermStudentUpdateDto(
                item.DefenseTermId,
                item.StudentProfileID,
                item.StudentCode,
                item.UserCode,
                item.CreatedAt,
                item.LastUpdated);
        }
    }
}