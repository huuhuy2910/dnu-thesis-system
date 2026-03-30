using System.ComponentModel.DataAnnotations;

namespace ThesisManagement.Api.DTOs.Rooms
{
    public class RoomStatusUpdateDto
    {
        [MaxLength(50)]
        public string? Status { get; set; }
    }

    public class RoomStatusSummaryItemDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class RoomImportRowResultDto
    {
        public int RowNumber { get; set; }
        public string RoomCode { get; set; } = string.Empty;
        public string? Status { get; set; }
        public string Result { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class RoomImportResultDto
    {
        public int TotalRows { get; set; }
        public int CreatedCount { get; set; }
        public int UpdatedCount { get; set; }
        public int FailedCount { get; set; }
        public List<RoomImportRowResultDto> Rows { get; set; } = new();
    }
}
