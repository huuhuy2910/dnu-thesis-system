using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using ThesisManagement.Api.Application.Command.MessageAttachments;
using ThesisManagement.Api.Application.Query.MessageAttachments;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.MessageAttachments.Command;
using ThesisManagement.Api.DTOs.MessageAttachments.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class MessageAttachmentsController : BaseApiController
    {
        private readonly IGetMessageAttachmentsListQuery _getMessageAttachmentsListQuery;
        private readonly IGetMessageAttachmentDetailQuery _getMessageAttachmentDetailQuery;
        private readonly IGetMessageAttachmentCreateQuery _getMessageAttachmentCreateQuery;
        private readonly IGetMessageAttachmentUpdateQuery _getMessageAttachmentUpdateQuery;
        private readonly ICreateMessageAttachmentCommand _createMessageAttachmentCommand;
        private readonly IUploadMessageAttachmentCommand _uploadMessageAttachmentCommand;
        private readonly IUpdateMessageAttachmentCommand _updateMessageAttachmentCommand;
        private readonly IDeleteMessageAttachmentCommand _deleteMessageAttachmentCommand;

        public MessageAttachmentsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetMessageAttachmentsListQuery getMessageAttachmentsListQuery,
            IGetMessageAttachmentDetailQuery getMessageAttachmentDetailQuery,
            IGetMessageAttachmentCreateQuery getMessageAttachmentCreateQuery,
            IGetMessageAttachmentUpdateQuery getMessageAttachmentUpdateQuery,
            ICreateMessageAttachmentCommand createMessageAttachmentCommand,
            IUploadMessageAttachmentCommand uploadMessageAttachmentCommand,
            IUpdateMessageAttachmentCommand updateMessageAttachmentCommand,
            IDeleteMessageAttachmentCommand deleteMessageAttachmentCommand) : base(uow, codeGen, mapper)
        {
            _getMessageAttachmentsListQuery = getMessageAttachmentsListQuery;
            _getMessageAttachmentDetailQuery = getMessageAttachmentDetailQuery;
            _getMessageAttachmentCreateQuery = getMessageAttachmentCreateQuery;
            _getMessageAttachmentUpdateQuery = getMessageAttachmentUpdateQuery;
            _createMessageAttachmentCommand = createMessageAttachmentCommand;
            _uploadMessageAttachmentCommand = uploadMessageAttachmentCommand;
            _updateMessageAttachmentCommand = updateMessageAttachmentCommand;
            _deleteMessageAttachmentCommand = deleteMessageAttachmentCommand;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] MessageAttachmentFilter filter)
        {
            var result = await _getMessageAttachmentsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<MessageAttachmentReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var item = await _getMessageAttachmentDetailQuery.ExecuteAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("Message attachment not found", 404));
            return Ok(ApiResponse<MessageAttachmentReadDto>.SuccessResponse(item));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sample = await _getMessageAttachmentCreateQuery.ExecuteAsync();
            return Ok(ApiResponse<MessageAttachmentCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] MessageAttachmentCreateDto dto)
        {
            var result = await _createMessageAttachmentCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<MessageAttachmentReadDto>.SuccessResponse(result.Data));
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> Upload()
        {
            if (!Request.HasFormContentType)
                return BadRequest(ApiResponse<object>.Fail("Request must be multipart/form-data", 400));

            var form = await Request.ReadFormAsync();
            var file = form.Files.FirstOrDefault();

            string? Get(params string[] keys)
            {
                foreach (var key in keys)
                {
                    if (form.TryGetValue(key, out StringValues value) && !StringValues.IsNullOrEmpty(value))
                        return value.ToString();
                }

                return null;
            }

            int messageId = 0;
            var rawMessageId = Get("MessageID", "messageID", "messageId", "messageid");
            if (!int.TryParse(rawMessageId, out messageId))
                return BadRequest(ApiResponse<object>.Fail("MessageID is required", 400));

            var thumbnailUrl = Get("ThumbnailURL", "thumbnailURL", "thumbnailUrl", "thumbnailurl");

            var result = await _uploadMessageAttachmentCommand.ExecuteAsync(file, messageId, thumbnailUrl);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(201, ApiResponse<MessageAttachmentReadDto>.SuccessResponse(result.Data, 1, 201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getMessageAttachmentUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Message attachment not found", 404));
            return Ok(ApiResponse<MessageAttachmentUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MessageAttachmentUpdateDto dto)
        {
            var result = await _updateMessageAttachmentCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<MessageAttachmentReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteMessageAttachmentCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object?>.SuccessResponse(result.Data));
        }
    }
}
