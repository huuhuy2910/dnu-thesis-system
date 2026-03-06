namespace ThesisManagement.Api.Application.Query.Departments
{
    public interface IGetDepartmentCreateQuery
    {
        object Execute();
    }

    public class GetDepartmentCreateQuery : IGetDepartmentCreateQuery
    {
        public object Execute() => new { Name = "", Description = "" };
    }
}
