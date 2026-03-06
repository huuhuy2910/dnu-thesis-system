using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.Conversations;
using ThesisManagement.Api.Application.Query.Conversations;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Conversations.Command;
using ThesisManagement.Api.DTOs.Conversations.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class ConversationsController : BaseApiController
    {
        private readonly IGetConversationsListQuery _getConversationsListQuery;
        private readonly IGetConversationDetailQuery _getConversationDetailQuery;
        private readonly IGetConversationCreateQuery _getConversationCreateQuery;
        private readonly IGetConversationUpdateQuery _getConversationUpdateQuery;
        private readonly ICreateConversationCommand _createConversationCommand;
        private readonly IUpdateConversationCommand _updateConversationCommand;
        private readonly IDeleteConversationCommand _deleteConversationCommand;

        public ConversationsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetConversationsListQuery getConversationsListQuery,
            IGetConversationDetailQuery getConversationDetailQuery,
            IGetConversationCreateQuery getConversationCreateQuery,
            IGetConversationUpdateQuery getConversationUpdateQuery,
            ICreateConversationCommand createConversationCommand,
            IUpdateConversationCommand updateConversationCommand,
            IDeleteConversationCommand deleteConversationCommand) : base(uow, codeGen, mapper)
        {
            _getConversationsListQuery = getConversationsListQuery;
            _getConversationDetailQuery = getConversationDetailQuery;
            _getConversationCreateQuery = getConversationCreateQuery;
            _getConversationUpdateQuery = getConversationUpdateQuery;
            _createConversationCommand = createConversationCommand;
            _updateConversationCommand = updateConversationCommand;
            _deleteConversationCommand = deleteConversationCommand;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] ConversationFilter filter)
        {
            var result = await _getConversationsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<ConversationReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var item = await _getConversationDetailQuery.ExecuteAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("Conversation not found", 404));
            return Ok(ApiResponse<ConversationReadDto>.SuccessResponse(item));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sample = await _getConversationCreateQuery.ExecuteAsync();
            return Ok(ApiResponse<ConversationCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ConversationCreateDto dto)
        {
            var result = await _createConversationCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<ConversationReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getConversationUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Conversation not found", 404));
            return Ok(ApiResponse<ConversationUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ConversationUpdateDto dto)
        {
            var result = await _updateConversationCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<ConversationReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteConversationCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object?>.SuccessResponse(result.Data));
        }
    }
}
