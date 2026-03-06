namespace ThesisManagement.Api.DTOs.MessageReactions.Command
{
    public record MessageReactionCreateDto(
        int MessageID,
        string UserCode,
        string ReactionType
    );

    public record MessageReactionUpdateDto(
        string? ReactionType
    );
}
