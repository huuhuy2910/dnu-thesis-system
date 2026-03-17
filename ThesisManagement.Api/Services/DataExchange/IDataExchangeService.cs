using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.DTOs.DataExchange;

namespace ThesisManagement.Api.Services.DataExchange
{
    public interface IDataExchangeService
    {
        Task<DataImportResultDto> ImportAsync(string module, IFormFile file, string? format);
        Task<DataExportResultDto> ExportAsync(string module, string? format);
    }
}
