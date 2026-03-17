using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.MessageReactions;
using ThesisManagement.Api.Application.Query.MessageReactions;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.MessageReactions.Command;
using ThesisManagement.Api.DTOs.MessageReactions.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class MessageReactionsController : BaseApiController
    {
        private readonly IGetMessageReactionsListQuery _getMessageReactionsListQuery;
        private readonly IGetMessageReactionDetailQuery _getMessageReactionDetailQuery;
        private readonly IGetMessageReactionCreateQuery _getMessageReactionCreateQuery;
        private readonly IGetMessageReactionUpdateQuery _getMessageReactionUpdateQuery;
        private readonly ICreateMessageReactionCommand _createMessageReactionCommand;
        private readonly IUpdateMessageReactionCommand _updateMessageReactionCommand;
        private readonly IDeleteMessageReactionCommand _deleteMessageReactionCommand;

        public MessageReactionsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetMessageReactionsListQuery getMessageReactionsListQuery,
            IGetMessageReactionDetailQuery getMessageReactionDetailQuery,
            IGetMessageReactionCreateQuery getMessageReactionCreateQuery,
            IGetMessageReactionUpdateQuery getMessageReactionUpdateQuery,
            ICreateMessageReactionCommand createMessageReactionCommand,
            IUpdateMessageReactionCommand updateMessageReactionCommand,
            IDeleteMessageReactionCommand deleteMessageReactionCommand) : base(uow, codeGen, mapper)
        {
            _getMessageReactionsListQuery = getMessageReactionsListQuery;
            _getMessageReactionDetailQuery = getMessageReactionDetailQuery;
            _getMessageReactionCreateQuery = getMessageReactionCreateQuery;
            _getMessageReactionUpdateQuery = getMessageReactionUpdateQuery;
            _createMessageReactionCommand = createMessageReactionCommand;
            _updateMessageReactionCommand = updateMessageReactionCommand;
            _deleteMessageReactionCommand = deleteMessageReactionCommand;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] MessageReactionFilter filter)
        {
            var result = await _getMessageReactionsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<MessageReactionReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var item = await _getMessageReactionDetailQuery.ExecuteAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("Message reaction not found", 404));
            return Ok(ApiResponse<MessageReactionReadDto>.SuccessResponse(item));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sample = await _getMessageReactionCreateQuery.ExecuteAsync();
            return Ok(ApiResponse<MessageReactionCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] MessageReactionCreateDto dto)
        {
            var result = await _createMessageReactionCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<MessageReactionReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getMessageReactionUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Message reaction not found", 404));
            return Ok(ApiResponse<MessageReactionUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MessageReactionUpdateDto dto)
        {
            var result = await _updateMessageReactionCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<MessageReactionReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!long.TryParse(id, out var parsedId))
                return BadRequest(ApiResponse<object>.Fail("Invalid reaction id format", 400));

            // FE can send temporary client ids (usually negative or larger than Int32).
            // Treat them as no-op so UI doesn't fail with 400.
            if (parsedId <= 0 || parsedId > int.MaxValue)
                return Ok(ApiResponse<object?>.SuccessResponse(null));

            var result = await _deleteMessageReactionCommand.ExecuteAsync((int)parsedId);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object?>.SuccessResponse(result.Data));
        }
    }
}
