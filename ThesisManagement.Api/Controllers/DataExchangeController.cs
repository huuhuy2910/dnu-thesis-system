using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DataExchange;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.DataExchange;

namespace ThesisManagement.Api.Controllers
{
    public class DataExchangeController : BaseApiController
    {
        private readonly IDataExchangeService _dataExchangeService;

        public DataExchangeController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            AutoMapper.IMapper mapper,
            IDataExchangeService dataExchangeService) : base(uow, codeGen, mapper)
        {
            _dataExchangeService = dataExchangeService;
        }

        [HttpPost("import/{module}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Import(string module, [FromForm] IFormFile file, [FromQuery] string? format = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<object>.Fail("File is required", 400));

            try
            {
                var result = await _dataExchangeService.ImportAsync(module, file, format);
                return Ok(ApiResponse<DataImportResultDto>.SuccessResponse(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message, 400));
            }
        }

        [HttpGet("export/{module}")]
        public async Task<IActionResult> Export(string module, [FromQuery] string format = "xlsx")
        {
            try
            {
                var result = await _dataExchangeService.ExportAsync(module, format);
                return File(result.Content, result.ContentType, result.FileName);
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message, 400));
            }
        }
    }
}
