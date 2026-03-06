using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.ConversationMembers;
using ThesisManagement.Api.Application.Query.ConversationMembers;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.ConversationMembers.Command;
using ThesisManagement.Api.DTOs.ConversationMembers.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class ConversationMembersController : BaseApiController
    {
        private readonly IGetConversationMembersListQuery _getConversationMembersListQuery;
        private readonly IGetConversationMemberDetailQuery _getConversationMemberDetailQuery;
        private readonly IGetConversationMemberCreateQuery _getConversationMemberCreateQuery;
        private readonly IGetConversationMemberUpdateQuery _getConversationMemberUpdateQuery;
        private readonly ICreateConversationMemberCommand _createConversationMemberCommand;
        private readonly IUpdateConversationMemberCommand _updateConversationMemberCommand;
        private readonly IDeleteConversationMemberCommand _deleteConversationMemberCommand;

        public ConversationMembersController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetConversationMembersListQuery getConversationMembersListQuery,
            IGetConversationMemberDetailQuery getConversationMemberDetailQuery,
            IGetConversationMemberCreateQuery getConversationMemberCreateQuery,
            IGetConversationMemberUpdateQuery getConversationMemberUpdateQuery,
            ICreateConversationMemberCommand createConversationMemberCommand,
            IUpdateConversationMemberCommand updateConversationMemberCommand,
            IDeleteConversationMemberCommand deleteConversationMemberCommand) : base(uow, codeGen, mapper)
        {
            _getConversationMembersListQuery = getConversationMembersListQuery;
            _getConversationMemberDetailQuery = getConversationMemberDetailQuery;
            _getConversationMemberCreateQuery = getConversationMemberCreateQuery;
            _getConversationMemberUpdateQuery = getConversationMemberUpdateQuery;
            _createConversationMemberCommand = createConversationMemberCommand;
            _updateConversationMemberCommand = updateConversationMemberCommand;
            _deleteConversationMemberCommand = deleteConversationMemberCommand;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] ConversationMemberFilter filter)
        {
            var result = await _getConversationMembersListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<ConversationMemberReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var item = await _getConversationMemberDetailQuery.ExecuteAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("Conversation member not found", 404));
            return Ok(ApiResponse<ConversationMemberReadDto>.SuccessResponse(item));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sample = await _getConversationMemberCreateQuery.ExecuteAsync();
            return Ok(ApiResponse<ConversationMemberCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ConversationMemberCreateDto dto)
        {
            var result = await _createConversationMemberCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<ConversationMemberReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getConversationMemberUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Conversation member not found", 404));
            return Ok(ApiResponse<ConversationMemberUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ConversationMemberUpdateDto dto)
        {
            var result = await _updateConversationMemberCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<ConversationMemberReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteConversationMemberCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object?>.SuccessResponse(result.Data));
        }
    }
}
