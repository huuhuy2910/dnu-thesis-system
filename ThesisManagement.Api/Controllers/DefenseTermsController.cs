using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.DefenseTerms;
using ThesisManagement.Api.Application.Query.DefenseTerms;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefenseTerms.Command;
using ThesisManagement.Api.DTOs.DefenseTerms.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class DefenseTermsController : BaseApiController
    {
        private readonly IGetDefenseTermsListQuery _getDefenseTermsListQuery;
        private readonly IGetDefenseTermDetailQuery _getDefenseTermDetailQuery;
        private readonly IGetDefenseTermCreateQuery _getDefenseTermCreateQuery;
        private readonly IGetDefenseTermUpdateQuery _getDefenseTermUpdateQuery;
        private readonly ICreateDefenseTermCommand _createDefenseTermCommand;
        private readonly IUpdateDefenseTermCommand _updateDefenseTermCommand;
        private readonly IDeleteDefenseTermCommand _deleteDefenseTermCommand;

        public DefenseTermsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetDefenseTermsListQuery getDefenseTermsListQuery,
            IGetDefenseTermDetailQuery getDefenseTermDetailQuery,
            IGetDefenseTermCreateQuery getDefenseTermCreateQuery,
            IGetDefenseTermUpdateQuery getDefenseTermUpdateQuery,
            ICreateDefenseTermCommand createDefenseTermCommand,
            IUpdateDefenseTermCommand updateDefenseTermCommand,
            IDeleteDefenseTermCommand deleteDefenseTermCommand) : base(uow, codeGen, mapper)
        {
            _getDefenseTermsListQuery = getDefenseTermsListQuery;
            _getDefenseTermDetailQuery = getDefenseTermDetailQuery;
            _getDefenseTermCreateQuery = getDefenseTermCreateQuery;
            _getDefenseTermUpdateQuery = getDefenseTermUpdateQuery;
            _createDefenseTermCommand = createDefenseTermCommand;
            _updateDefenseTermCommand = updateDefenseTermCommand;
            _deleteDefenseTermCommand = deleteDefenseTermCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] DefenseTermFilter filter)
        {
            var result = await _getDefenseTermsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<DefenseTermReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var dto = await _getDefenseTermDetailQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("DefenseTerm not found", 404));

            return Ok(ApiResponse<DefenseTermReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getDefenseTermCreateQuery.Execute();
            return Ok(ApiResponse<DefenseTermCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] DefenseTermCreateDto dto)
        {
            var result = await _createDefenseTermCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<DefenseTermReadDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getDefenseTermUpdateQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("DefenseTerm not found", 404));

            return Ok(ApiResponse<DefenseTermUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DefenseTermUpdateDto dto)
        {
            var result = await _updateDefenseTermCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<DefenseTermReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteDefenseTermCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}