using System;

namespace ThesisManagement.Api.DTOs.ConversationMembers.Query
{
    public record ConversationMemberReadDto(
        int MemberID,
        int ConversationID,
        string? ConversationCode,
        int UserID,
        string UserCode,
        string MemberRole,
        string? NickName,
        bool IsMuted,
        bool IsPinned,
        int? LastReadMessageID,
        DateTime? LastReadAt,
        int UnreadCount,
        DateTime? JoinedAt,
        DateTime? LeftAt
    );
}
