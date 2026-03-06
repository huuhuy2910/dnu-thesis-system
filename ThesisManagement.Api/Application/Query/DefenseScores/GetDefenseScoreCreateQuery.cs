namespace ThesisManagement.Api.Application.Query.DefenseScores
{
    public interface IGetDefenseScoreCreateQuery
    {
        object Execute();
    }

    public class GetDefenseScoreCreateQuery : IGetDefenseScoreCreateQuery
    {
        public object Execute() => new { AssignmentID = 0, MemberLecturerUserID = 0, Score = 0.0m };
    }
}
