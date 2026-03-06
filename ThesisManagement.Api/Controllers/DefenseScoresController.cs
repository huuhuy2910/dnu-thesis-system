using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.DefenseScores;
using ThesisManagement.Api.Application.Query.DefenseScores;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefenseScores.Command;
using ThesisManagement.Api.DTOs.DefenseScores.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class DefenseScoresController : BaseApiController
    {
        private readonly IGetDefenseScoresListQuery _getDefenseScoresListQuery;
        private readonly IGetDefenseScoreDetailQuery _getDefenseScoreDetailQuery;
        private readonly IGetDefenseScoreCreateQuery _getDefenseScoreCreateQuery;
        private readonly IGetDefenseScoreUpdateQuery _getDefenseScoreUpdateQuery;
        private readonly ICreateDefenseScoreCommand _createDefenseScoreCommand;
        private readonly IUpdateDefenseScoreCommand _updateDefenseScoreCommand;
        private readonly IDeleteDefenseScoreCommand _deleteDefenseScoreCommand;

        public DefenseScoresController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetDefenseScoresListQuery getDefenseScoresListQuery,
            IGetDefenseScoreDetailQuery getDefenseScoreDetailQuery,
            IGetDefenseScoreCreateQuery getDefenseScoreCreateQuery,
            IGetDefenseScoreUpdateQuery getDefenseScoreUpdateQuery,
            ICreateDefenseScoreCommand createDefenseScoreCommand,
            IUpdateDefenseScoreCommand updateDefenseScoreCommand,
            IDeleteDefenseScoreCommand deleteDefenseScoreCommand) : base(uow, codeGen, mapper)
        {
            _getDefenseScoresListQuery = getDefenseScoresListQuery;
            _getDefenseScoreDetailQuery = getDefenseScoreDetailQuery;
            _getDefenseScoreCreateQuery = getDefenseScoreCreateQuery;
            _getDefenseScoreUpdateQuery = getDefenseScoreUpdateQuery;
            _createDefenseScoreCommand = createDefenseScoreCommand;
            _updateDefenseScoreCommand = updateDefenseScoreCommand;
            _deleteDefenseScoreCommand = deleteDefenseScoreCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] DefenseScoreFilter filter)
        {
            var result = await _getDefenseScoresListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<DefenseScoreReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getDefenseScoreDetailQuery.ExecuteAsync(code);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Score not found", 404));
            return Ok(ApiResponse<DefenseScoreReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(_getDefenseScoreCreateQuery.Execute()));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] DefenseScoreCreateDto dto)
        {
            var result = await _createDefenseScoreCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<DefenseScoreReadDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getDefenseScoreUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Score not found", 404));
            return Ok(ApiResponse<DefenseScoreUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DefenseScoreUpdateDto dto)
        {
            var result = await _updateDefenseScoreCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<DefenseScoreReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteDefenseScoreCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}
