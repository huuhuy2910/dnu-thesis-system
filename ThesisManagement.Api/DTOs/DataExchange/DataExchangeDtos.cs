using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace ThesisManagement.Api.DTOs.DataExchange
{
    public class DataImportRequestDto
    {
        public IFormFile? File { get; set; }
        public string? Format { get; set; }
    }

    public class DataImportResultDto
    {
        public string Module { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public int TotalRows { get; set; }
        public int CreatedCount { get; set; }
        public int UpdatedCount { get; set; }
        public int FailedCount { get; set; }
        public List<string> Errors { get; set; } = new();
    }

    public class DataExportResultDto
    {
        public string Module { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public int TotalRows { get; set; }
        public byte[] Content { get; set; } = Array.Empty<byte>();
        public string ContentType { get; set; } = "application/octet-stream";
    }
}
