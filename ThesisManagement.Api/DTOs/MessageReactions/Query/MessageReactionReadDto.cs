using System;

namespace ThesisManagement.Api.DTOs.MessageReactions.Query
{
    public record MessageReactionReadDto(
        int ReactionID,
        int MessageID,
        string UserCode,
        string ReactionType,
        DateTime? ReactedAt,
        string? DisplayName = null,
        string? AvatarUrl = null
    );
}
