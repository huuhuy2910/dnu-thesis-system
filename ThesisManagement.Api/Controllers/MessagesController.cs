using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.Messages;
using ThesisManagement.Api.Application.Query.Messages;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Messages.Command;
using ThesisManagement.Api.DTOs.Messages.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class MessagesController : BaseApiController
    {
        private readonly IGetMessagesListQuery _getMessagesListQuery;
        private readonly IGetMessageDetailQuery _getMessageDetailQuery;
        private readonly IGetMessageCreateQuery _getMessageCreateQuery;
        private readonly IGetMessageUpdateQuery _getMessageUpdateQuery;
        private readonly ICreateMessageCommand _createMessageCommand;
        private readonly IUpdateMessageCommand _updateMessageCommand;
        private readonly IDeleteMessageCommand _deleteMessageCommand;

        public MessagesController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetMessagesListQuery getMessagesListQuery,
            IGetMessageDetailQuery getMessageDetailQuery,
            IGetMessageCreateQuery getMessageCreateQuery,
            IGetMessageUpdateQuery getMessageUpdateQuery,
            ICreateMessageCommand createMessageCommand,
            IUpdateMessageCommand updateMessageCommand,
            IDeleteMessageCommand deleteMessageCommand) : base(uow, codeGen, mapper)
        {
            _getMessagesListQuery = getMessagesListQuery;
            _getMessageDetailQuery = getMessageDetailQuery;
            _getMessageCreateQuery = getMessageCreateQuery;
            _getMessageUpdateQuery = getMessageUpdateQuery;
            _createMessageCommand = createMessageCommand;
            _updateMessageCommand = updateMessageCommand;
            _deleteMessageCommand = deleteMessageCommand;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] MessageFilter filter)
        {
            var result = await _getMessagesListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<MessageReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var item = await _getMessageDetailQuery.ExecuteAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("Message not found", 404));
            return Ok(ApiResponse<MessageReadDto>.SuccessResponse(item));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sample = await _getMessageCreateQuery.ExecuteAsync();
            return Ok(ApiResponse<MessageCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] MessageCreateDto dto)
        {
            var result = await _createMessageCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<MessageReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getMessageUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Message not found", 404));
            return Ok(ApiResponse<MessageUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MessageUpdateDto dto)
        {
            var result = await _updateMessageCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<MessageReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteMessageCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object?>.SuccessResponse(result.Data));
        }
    }
}
