namespace ThesisManagement.Api.Application.Query.Users
{
    public interface IGetUserCreateQuery
    {
        object Execute();
    }

    public class GetUserCreateQuery : IGetUserCreateQuery
    {
        public object Execute()
            => new { UserCode = "", PasswordHash = "", Role = "" };
    }
}
