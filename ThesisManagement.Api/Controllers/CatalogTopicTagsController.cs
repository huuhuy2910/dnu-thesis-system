using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.CatalogTopicTags;
using ThesisManagement.Api.Application.Query.CatalogTopicTags;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.CatalogTopicTags.Command;
using ThesisManagement.Api.DTOs.CatalogTopicTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class CatalogTopicTagsController : BaseApiController
    {
        private readonly IGetCatalogTopicTagsListQuery _getCatalogTopicTagsListQuery;
        private readonly IGetCatalogTopicTagCreateQuery _getCatalogTopicTagCreateQuery;
        private readonly IGetCatalogTopicTagsByCatalogTopicQuery _getCatalogTopicTagsByCatalogTopicQuery;
        private readonly IGetCatalogTopicTagsByTagQuery _getCatalogTopicTagsByTagQuery;
        private readonly ICreateCatalogTopicTagCommand _createCatalogTopicTagCommand;
        private readonly IDeleteCatalogTopicTagCommand _deleteCatalogTopicTagCommand;

        public CatalogTopicTagsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetCatalogTopicTagsListQuery getCatalogTopicTagsListQuery,
            IGetCatalogTopicTagCreateQuery getCatalogTopicTagCreateQuery,
            IGetCatalogTopicTagsByCatalogTopicQuery getCatalogTopicTagsByCatalogTopicQuery,
            IGetCatalogTopicTagsByTagQuery getCatalogTopicTagsByTagQuery,
            ICreateCatalogTopicTagCommand createCatalogTopicTagCommand,
            IDeleteCatalogTopicTagCommand deleteCatalogTopicTagCommand) : base(uow, codeGen, mapper)
        {
            _getCatalogTopicTagsListQuery = getCatalogTopicTagsListQuery;
            _getCatalogTopicTagCreateQuery = getCatalogTopicTagCreateQuery;
            _getCatalogTopicTagsByCatalogTopicQuery = getCatalogTopicTagsByCatalogTopicQuery;
            _getCatalogTopicTagsByTagQuery = getCatalogTopicTagsByTagQuery;
            _createCatalogTopicTagCommand = createCatalogTopicTagCommand;
            _deleteCatalogTopicTagCommand = deleteCatalogTopicTagCommand;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] CatalogTopicTagFilter filter)
        {
            var result = await _getCatalogTopicTagsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<CatalogTopicTagReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getCatalogTopicTagCreateQuery.Execute();
            return Ok(ApiResponse<CatalogTopicTagCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CatalogTopicTagCreateDto dto)
        {
            var result = await _createCatalogTopicTagCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<CatalogTopicTagReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete")]
        public async Task<IActionResult> Delete([FromQuery] int catalogTopicId, [FromQuery] int tagId)
        {
            var result = await _deleteCatalogTopicTagCommand.ExecuteAsync(catalogTopicId, tagId);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<string>.SuccessResponse(result.Data));
        }

        [HttpGet("by-catalog-topic/{catalogTopicId}")]
        public async Task<IActionResult> GetByCatalogTopic(int catalogTopicId)
        {
            var dtos = await _getCatalogTopicTagsByCatalogTopicQuery.ExecuteByIdAsync(catalogTopicId);
            return Ok(ApiResponse<IEnumerable<CatalogTopicTagReadDto>>.SuccessResponse(dtos));
        }

        [HttpGet("by-tag/{tagId}")]
        public async Task<IActionResult> GetByTag(int tagId)
        {
            var dtos = await _getCatalogTopicTagsByTagQuery.ExecuteByIdAsync(tagId);
            return Ok(ApiResponse<IEnumerable<CatalogTopicTagReadDto>>.SuccessResponse(dtos));
        }

        [HttpGet("by-catalog-topic-code/{catalogTopicCode}")]
        public async Task<IActionResult> GetByCatalogTopicCode(string catalogTopicCode)
        {
            var dtos = await _getCatalogTopicTagsByCatalogTopicQuery.ExecuteByCodeAsync(catalogTopicCode);
            return Ok(ApiResponse<IEnumerable<CatalogTopicTagReadDto>>.SuccessResponse(dtos));
        }

        [HttpGet("by-tag-code/{tagCode}")]
        public async Task<IActionResult> GetByTagCode(string tagCode)
        {
            var dtos = await _getCatalogTopicTagsByTagQuery.ExecuteByCodeAsync(tagCode);
            return Ok(ApiResponse<IEnumerable<CatalogTopicTagReadDto>>.SuccessResponse(dtos));
        }
    }
}
