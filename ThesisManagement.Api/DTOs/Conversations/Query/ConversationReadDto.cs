using System;

namespace ThesisManagement.Api.DTOs.Conversations.Query
{
    public record ConversationReadDto(
        int ConversationID,
        string ConversationCode,
        string ConversationType,
        string? Title,
        int CreatedByUserID,
        string? CreatedByUserCode,
        string? AvatarURL,
        int? LastMessageID,
        string? LastMessagePreview,
        DateTime? LastMessageAt,
        bool IsArchived,
        DateTime? CreatedAt,
        DateTime? LastUpdated
    );
}
