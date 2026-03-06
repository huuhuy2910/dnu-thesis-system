using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.MessageReadReceipts;
using ThesisManagement.Api.Application.Query.MessageReadReceipts;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.MessageReadReceipts.Command;
using ThesisManagement.Api.DTOs.MessageReadReceipts.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class MessageReadReceiptsController : BaseApiController
    {
        private readonly IGetMessageReadReceiptsListQuery _getMessageReadReceiptsListQuery;
        private readonly IGetMessageReadReceiptDetailQuery _getMessageReadReceiptDetailQuery;
        private readonly IGetMessageReadReceiptCreateQuery _getMessageReadReceiptCreateQuery;
        private readonly IGetMessageReadReceiptUpdateQuery _getMessageReadReceiptUpdateQuery;
        private readonly ICreateMessageReadReceiptCommand _createMessageReadReceiptCommand;
        private readonly IUpdateMessageReadReceiptCommand _updateMessageReadReceiptCommand;
        private readonly IDeleteMessageReadReceiptCommand _deleteMessageReadReceiptCommand;

        public MessageReadReceiptsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetMessageReadReceiptsListQuery getMessageReadReceiptsListQuery,
            IGetMessageReadReceiptDetailQuery getMessageReadReceiptDetailQuery,
            IGetMessageReadReceiptCreateQuery getMessageReadReceiptCreateQuery,
            IGetMessageReadReceiptUpdateQuery getMessageReadReceiptUpdateQuery,
            ICreateMessageReadReceiptCommand createMessageReadReceiptCommand,
            IUpdateMessageReadReceiptCommand updateMessageReadReceiptCommand,
            IDeleteMessageReadReceiptCommand deleteMessageReadReceiptCommand) : base(uow, codeGen, mapper)
        {
            _getMessageReadReceiptsListQuery = getMessageReadReceiptsListQuery;
            _getMessageReadReceiptDetailQuery = getMessageReadReceiptDetailQuery;
            _getMessageReadReceiptCreateQuery = getMessageReadReceiptCreateQuery;
            _getMessageReadReceiptUpdateQuery = getMessageReadReceiptUpdateQuery;
            _createMessageReadReceiptCommand = createMessageReadReceiptCommand;
            _updateMessageReadReceiptCommand = updateMessageReadReceiptCommand;
            _deleteMessageReadReceiptCommand = deleteMessageReadReceiptCommand;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] MessageReadReceiptFilter filter)
        {
            var result = await _getMessageReadReceiptsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<MessageReadReceiptReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var item = await _getMessageReadReceiptDetailQuery.ExecuteAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("Message read receipt not found", 404));
            return Ok(ApiResponse<MessageReadReceiptReadDto>.SuccessResponse(item));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sample = await _getMessageReadReceiptCreateQuery.ExecuteAsync();
            return Ok(ApiResponse<MessageReadReceiptCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] MessageReadReceiptCreateDto dto)
        {
            var result = await _createMessageReadReceiptCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<MessageReadReceiptReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getMessageReadReceiptUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Message read receipt not found", 404));
            return Ok(ApiResponse<MessageReadReceiptUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MessageReadReceiptUpdateDto dto)
        {
            var result = await _updateMessageReadReceiptCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<MessageReadReceiptReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteMessageReadReceiptCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object?>.SuccessResponse(result.Data));
        }
    }
}
