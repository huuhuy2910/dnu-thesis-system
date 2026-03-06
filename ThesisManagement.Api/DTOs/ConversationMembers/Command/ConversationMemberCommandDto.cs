using System;

namespace ThesisManagement.Api.DTOs.ConversationMembers.Command
{
    public record ConversationMemberCreateDto(
        int ConversationID,
        int? UserID,
        string UserCode,
        string? MemberRole,
        bool? IsMuted,
        bool? IsPinned
    );

    public record ConversationMemberUpdateDto(
        string? MemberRole,
        string? NickName,
        bool? IsMuted,
        bool? IsPinned,
        DateTime? JoinedAt,
        DateTime? LeftAt,
        int? LastReadMessageID,
        DateTime? LastReadAt,
        int? UnreadCount
    );
}
