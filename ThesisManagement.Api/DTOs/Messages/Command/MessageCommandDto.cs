using System;

namespace ThesisManagement.Api.DTOs.Messages.Command
{
    public record MessageCreateDto(
        int ConversationID,
        string SenderUserCode,
        string? Content,
        string? MessageType,
        int? ReplyToMessageID
    );

    public record MessageUpdateDto(
        string? Content,
        string? MessageType,
        bool? IsDeleted,
        DateTime? EditedAt,
        DateTime? DeletedAt
    );
}
