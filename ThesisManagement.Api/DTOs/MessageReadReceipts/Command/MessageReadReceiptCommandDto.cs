using System;

namespace ThesisManagement.Api.DTOs.MessageReadReceipts.Command
{
    public record MessageReadReceiptCreateDto(
        int MessageID,
        string UserCode,
        DateTime? ReadAt
    );

    public record MessageReadReceiptUpdateDto(
        DateTime? ReadAt
    );
}
