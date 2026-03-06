using System;

namespace ThesisManagement.Api.DTOs.Messages.Query
{
    public record MessageReadDto(
        int MessageID,
        int ConversationID,
        string SenderUserCode,
        string? Content,
        string MessageType,
        int? ReplyToMessageID,
        bool IsDeleted,
        DateTime? SentAt,
        DateTime? EditedAt,
        DateTime? DeletedAt
    );
}
