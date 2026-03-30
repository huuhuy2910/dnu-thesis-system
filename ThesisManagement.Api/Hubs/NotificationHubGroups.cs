namespace ThesisManagement.Api.Hubs
{
    public static class NotificationHubGroups
    {
        public static string User(string userCode) => $"user:{userCode}";
    }
}
