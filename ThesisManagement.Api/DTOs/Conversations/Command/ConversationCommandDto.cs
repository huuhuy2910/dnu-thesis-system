using System;

namespace ThesisManagement.Api.DTOs.Conversations.Command
{
    public record ConversationCreateDto(
        string ConversationType,
        string? Title,
        int? CreatedByUserID,
        string? CreatedByUserCode,
        string? AvatarURL,
        bool? IsArchived
    );

    public record ConversationUpdateDto(
        string? ConversationType,
        string? Title,
        string? AvatarURL,
        bool? IsArchived,
        DateTime? LastUpdated
    );
}
