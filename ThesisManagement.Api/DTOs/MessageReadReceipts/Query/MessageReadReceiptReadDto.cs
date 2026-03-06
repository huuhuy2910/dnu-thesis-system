using System;

namespace ThesisManagement.Api.DTOs.MessageReadReceipts.Query
{
    public record MessageReadReceiptReadDto(
        int ReceiptID,
        int MessageID,
        int UserID,
        string UserCode,
        DateTime? ReadAt
    );
}
