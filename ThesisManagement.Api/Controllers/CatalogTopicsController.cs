using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.CatalogTopics;
using ThesisManagement.Api.Application.Query.CatalogTopics;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.CatalogTopics.Command;
using ThesisManagement.Api.DTOs.CatalogTopics.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class CatalogTopicsController : BaseApiController
    {
        private readonly IGetCatalogTopicsListQuery _getCatalogTopicsListQuery;
        private readonly IGetCatalogTopicDetailQuery _getCatalogTopicDetailQuery;
        private readonly IGetCatalogTopicCreateQuery _getCatalogTopicCreateQuery;
        private readonly IGetCatalogTopicUpdateQuery _getCatalogTopicUpdateQuery;
        private readonly ICreateCatalogTopicCommand _createCatalogTopicCommand;
        private readonly IUpdateCatalogTopicCommand _updateCatalogTopicCommand;
        private readonly IDeleteCatalogTopicCommand _deleteCatalogTopicCommand;

        public CatalogTopicsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetCatalogTopicsListQuery getCatalogTopicsListQuery,
            IGetCatalogTopicDetailQuery getCatalogTopicDetailQuery,
            IGetCatalogTopicCreateQuery getCatalogTopicCreateQuery,
            IGetCatalogTopicUpdateQuery getCatalogTopicUpdateQuery,
            ICreateCatalogTopicCommand createCatalogTopicCommand,
            IUpdateCatalogTopicCommand updateCatalogTopicCommand,
            IDeleteCatalogTopicCommand deleteCatalogTopicCommand) : base(uow, codeGen, mapper)
        {
            _getCatalogTopicsListQuery = getCatalogTopicsListQuery;
            _getCatalogTopicDetailQuery = getCatalogTopicDetailQuery;
            _getCatalogTopicCreateQuery = getCatalogTopicCreateQuery;
            _getCatalogTopicUpdateQuery = getCatalogTopicUpdateQuery;
            _createCatalogTopicCommand = createCatalogTopicCommand;
            _updateCatalogTopicCommand = updateCatalogTopicCommand;
            _deleteCatalogTopicCommand = deleteCatalogTopicCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] CatalogTopicFilter filter)
        {
            var result = await _getCatalogTopicsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<CatalogTopicReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getCatalogTopicDetailQuery.ExecuteAsync(code);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("CatalogTopic not found", 404));
            return Ok(ApiResponse<CatalogTopicReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(_getCatalogTopicCreateQuery.Execute()));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CatalogTopicCreateDto dto)
        {
            var result = await _createCatalogTopicCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<CatalogTopicReadDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpGet("get-update/{code}")]
        public async Task<IActionResult> GetUpdate(string code)
        {
            var dto = await _getCatalogTopicUpdateQuery.ExecuteAsync(code);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("CatalogTopic not found", 404));
            return Ok(ApiResponse<CatalogTopicUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{code}")]
        public async Task<IActionResult> Update(string code, [FromBody] CatalogTopicUpdateDto dto)
        {
            var result = await _updateCatalogTopicCommand.ExecuteAsync(code, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<CatalogTopicReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{code}")]
        public async Task<IActionResult> Delete(string code)
        {
            var result = await _deleteCatalogTopicCommand.ExecuteAsync(code);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}
