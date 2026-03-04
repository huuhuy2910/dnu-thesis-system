using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.DTOs.SubmissionFiles.Command;

namespace ThesisManagement.Api.Application.Validate.SubmissionFiles
{
    public static class SubmissionFileCommandValidator
    {
        public static string? ValidateCreate(SubmissionFileCreateDto dto)
        {
            if (dto.SubmissionID <= 0)
                return "SubmissionID must be greater than zero";

            if (string.IsNullOrWhiteSpace(dto.FileURL))
                return "FileURL is required";

            return null;
        }

        public static string? ValidateUpload(int submissionId, IFormFile? file)
        {
            if (submissionId <= 0)
                return "SubmissionID must be greater than zero";

            if (file == null || file.Length == 0)
                return "File is required";

            return null;
        }
    }
}
