using System;

namespace ThesisManagement.Api.DTOs
{
    public record CommitteeMemberCreateDto(string CommitteeCode, string? MemberUserCode, string? MemberLecturerCode, string? Role, bool? IsChair);
    public record CommitteeMemberUpdateDto(string? MemberLecturerCode, string? Role, bool? IsChair);
    public record CommitteeMemberReadDto(int CommitteeMemberID, string? CommitteeCode, string? MemberUserCode, string? MemberLecturerCode, string? Role, bool? IsChair, DateTime? CreatedAt, DateTime? LastUpdated);
}
