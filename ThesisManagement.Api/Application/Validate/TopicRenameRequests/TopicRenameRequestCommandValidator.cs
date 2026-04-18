using ThesisManagement.Api.DTOs.TopicRenameRequests.Command;

namespace ThesisManagement.Api.Application.Validate.TopicRenameRequests
{
    public static class TopicRenameRequestCommandValidator
    {
        public static string? ValidateCreate(TopicRenameRequestCreateDto dto)
        {
            if (dto.TopicID.GetValueOrDefault() <= 0 && string.IsNullOrWhiteSpace(dto.TopicCode))
                return "TopicID or TopicCode is required";

            if (string.IsNullOrWhiteSpace(dto.NewTitle))
                return "NewTitle is required";

            return null;
        }

        public static string? ValidateUpdate(TopicRenameRequestUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NewTitle) && string.IsNullOrWhiteSpace(dto.Reason))
                return "At least one field must be updated";

            return null;
        }

        public static string? ValidateReview(TopicRenameRequestReviewDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Action))
                return "Action is required";

            var action = dto.Action.Trim().ToLowerInvariant();
            if (action is not ("approve" or "reject"))
                return "Action must be approve or reject";

            if (action == "reject" && string.IsNullOrWhiteSpace(dto.Comment))
                return "Reject comment is required";

            return null;
        }
    }
}