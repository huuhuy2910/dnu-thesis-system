using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.DataExchange;
using ThesisManagement.Api.Services.DataExchange;

namespace ThesisManagement.Api.Application.Command.Tags
{
    public interface IImportTagsCommand
    {
        Task<OperationResult<DataImportResultDto>> ExecuteAsync(IFormFile file, string? format);
    }

    public class ImportTagsCommand : IImportTagsCommand
    {
        private readonly IDataExchangeService _dataExchangeService;

        public ImportTagsCommand(IDataExchangeService dataExchangeService)
        {
            _dataExchangeService = dataExchangeService;
        }

        public async Task<OperationResult<DataImportResultDto>> ExecuteAsync(IFormFile file, string? format)
        {
            if (file == null || file.Length == 0)
                return OperationResult<DataImportResultDto>.Failed("File is required", 400);

            try
            {
                var result = await _dataExchangeService.ImportAsync("tags", file, format);
                return OperationResult<DataImportResultDto>.Succeeded(result);
            }
            catch (Exception ex)
            {
                return OperationResult<DataImportResultDto>.Failed(ex.Message, 400);
            }
        }
    }
}
