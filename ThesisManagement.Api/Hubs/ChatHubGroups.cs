namespace ThesisManagement.Api.Hubs
{
    public static class ChatHubGroups
    {
        public static string Conversation(string conversationCode)
        {
            var normalized = (conversationCode ?? string.Empty).Trim().ToUpperInvariant();
            return $"conversation:{normalized}";
        }
    }
}