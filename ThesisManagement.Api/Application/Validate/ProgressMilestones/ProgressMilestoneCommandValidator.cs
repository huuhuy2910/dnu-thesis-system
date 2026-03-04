namespace ThesisManagement.Api.Application.Validate.ProgressMilestones
{
    public static class ProgressMilestoneCommandValidator
    {
        public static string? ValidateCreate(string? topicCode)
        {
            if (string.IsNullOrWhiteSpace(topicCode))
                return "TopicCode is required";

            return null;
        }
    }
}
