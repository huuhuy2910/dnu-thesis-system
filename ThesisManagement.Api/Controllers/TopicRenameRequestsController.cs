using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.TopicRenameRequests;
using ThesisManagement.Api.Application.Query.TopicRenameRequests;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.TopicRenameRequests.Command;
using ThesisManagement.Api.DTOs.TopicRenameRequests.Query;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;
using ThesisManagement.Api.Services.TopicRenameRequests;

namespace ThesisManagement.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Admin,Head,Lecturer,Student,StudentService")]
    [Route("api/workflows/topic-rename-requests")]
    public class TopicRenameRequestsController : BaseApiController
    {
        private readonly IGetTopicRenameRequestsListQuery _getListQuery;
        private readonly IGetTopicRenameRequestDetailQuery _getDetailQuery;
        private readonly IGetTopicRenameRequestCreateQuery _getCreateQuery;
        private readonly IGetTopicRenameRequestUpdateQuery _getUpdateQuery;
        private readonly ICreateTopicRenameRequestCommand _createCommand;
        private readonly IUpdateTopicRenameRequestCommand _updateCommand;
        private readonly IDeleteTopicRenameRequestCommand _deleteCommand;
        private readonly IDeleteTopicRenameRequestTemplateCommand _deleteTemplateCommand;
        private readonly IReviewTopicRenameRequestCommand _reviewCommand;
        private readonly IGenerateTopicRenameRequestTemplateCommand _generateTemplateCommand;
        private readonly IFileStorageService _storageService;

        public TopicRenameRequestsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetTopicRenameRequestsListQuery getListQuery,
            IGetTopicRenameRequestDetailQuery getDetailQuery,
            IGetTopicRenameRequestCreateQuery getCreateQuery,
            IGetTopicRenameRequestUpdateQuery getUpdateQuery,
            ICreateTopicRenameRequestCommand createCommand,
            IUpdateTopicRenameRequestCommand updateCommand,
            IDeleteTopicRenameRequestCommand deleteCommand,
            IDeleteTopicRenameRequestTemplateCommand deleteTemplateCommand,
            IReviewTopicRenameRequestCommand reviewCommand,
            IGenerateTopicRenameRequestTemplateCommand generateTemplateCommand,
            IFileStorageService storageService) : base(uow, codeGen, mapper)
        {
            _getListQuery = getListQuery;
            _getDetailQuery = getDetailQuery;
            _getCreateQuery = getCreateQuery;
            _getUpdateQuery = getUpdateQuery;
            _createCommand = createCommand;
            _updateCommand = updateCommand;
            _deleteCommand = deleteCommand;
            _deleteTemplateCommand = deleteTemplateCommand;
            _reviewCommand = reviewCommand;
            _generateTemplateCommand = generateTemplateCommand;
            _storageService = storageService;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] TopicRenameRequestFilter filter)
        {
            var result = await _getListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<TopicRenameRequestReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{id:int}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var dto = await _getDetailQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("TopicRenameRequest not found", 404));

            return Ok(ApiResponse<TopicRenameRequestDetailDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
            => Ok(ApiResponse<TopicRenameRequestCreateDto>.SuccessResponse(_getCreateQuery.Execute()));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TopicRenameRequestCreateDto dto)
        {
            var result = await _createCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<TopicRenameRequestReadDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpGet("get-update/{id:int}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getUpdateQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("TopicRenameRequest not found", 404));

            return Ok(ApiResponse<TopicRenameRequestUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] TopicRenameRequestUpdateDto dto)
        {
            var result = await _updateCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TopicRenameRequestReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }

        [HttpDelete("{id:int}/delete-template")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            var result = await _deleteTemplateCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }

        [HttpPost("{id:int}/review")]
        [Authorize(Roles = "Admin,Head,Lecturer,StudentService")]
        public async Task<IActionResult> Review(int id, [FromBody] TopicRenameRequestReviewDto dto)
        {
            var result = await _reviewCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TopicRenameRequestReadDto>.SuccessResponse(result.Data));
        }

        [HttpPost("{id:int}/generate-template")]
        public async Task<IActionResult> GenerateTemplate(int id, [FromQuery] string? placeOfBirth = null)
        {
            var result = await _generateTemplateCommand.ExecuteAsync(id, placeOfBirth);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TopicRenameRequestFileReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("{id:int}/download-template")]
        public async Task<IActionResult> DownloadTemplate(int id)
        {
            var detail = await _getDetailQuery.ExecuteAsync(id);
            if (detail == null)
                return NotFound(ApiResponse<object>.Fail("TopicRenameRequest not found", 404));

            var fileUrl = detail.Request.GeneratedFileUrl;
            if (string.IsNullOrWhiteSpace(fileUrl))
            {
                var generated = await _generateTemplateCommand.ExecuteAsync(id);
                if (!generated.Success || generated.Data == null)
                    return StatusCode(generated.StatusCode, ApiResponse<object>.Fail(generated.ErrorMessage ?? "Template generation failed", generated.StatusCode));

                fileUrl = generated.Data.FileUrl;
            }

            var fileResult = await _storageService.OpenReadAsync(fileUrl);
            if (!fileResult.Success)
                return StatusCode(fileResult.StatusCode, ApiResponse<object>.Fail(fileResult.ErrorMessage ?? "Template not found", fileResult.StatusCode));

            return File(fileResult.Data!.Stream, fileResult.Data.ContentType, fileResult.Data.FileName);
        }
    }
}