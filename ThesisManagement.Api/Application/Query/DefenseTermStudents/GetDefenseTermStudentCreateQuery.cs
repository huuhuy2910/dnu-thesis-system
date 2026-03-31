using ThesisManagement.Api.DTOs.DefenseTermStudents.Command;

namespace ThesisManagement.Api.Application.Query.DefenseTermStudents
{
    public interface IGetDefenseTermStudentCreateQuery
    {
        DefenseTermStudentCreateDto Execute();
    }

    public class GetDefenseTermStudentCreateQuery : IGetDefenseTermStudentCreateQuery
    {
        public DefenseTermStudentCreateDto Execute()
            => new(
                DefenseTermId: 0,
                StudentProfileID: null,
                StudentCode: null,
                UserCode: null,
                CreatedAt: DateTime.UtcNow,
                LastUpdated: DateTime.UtcNow);
    }
}