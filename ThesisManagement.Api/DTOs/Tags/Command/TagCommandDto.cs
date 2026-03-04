namespace ThesisManagement.Api.DTOs.Tags.Command
{
    public record TagCreateDto(
        string TagCode,
        string TagName,
        string? Description
    );

    public record TagUpdateDto(
        string? TagName,
        string? Description
    );
}