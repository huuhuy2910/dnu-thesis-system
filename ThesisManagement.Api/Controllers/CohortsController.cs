using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.Cohorts;
using ThesisManagement.Api.Application.Query.Cohorts;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Cohorts.Command;
using ThesisManagement.Api.DTOs.Cohorts.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class CohortsController : BaseApiController
    {
        private readonly IGetCohortsListQuery _getCohortsListQuery;
        private readonly IGetCohortDetailQuery _getCohortDetailQuery;
        private readonly IGetCohortCreateQuery _getCohortCreateQuery;
        private readonly IGetCohortUpdateQuery _getCohortUpdateQuery;
        private readonly ICreateCohortCommand _createCohortCommand;
        private readonly IUpdateCohortCommand _updateCohortCommand;
        private readonly IDeleteCohortCommand _deleteCohortCommand;

        public CohortsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetCohortsListQuery getCohortsListQuery,
            IGetCohortDetailQuery getCohortDetailQuery,
            IGetCohortCreateQuery getCohortCreateQuery,
            IGetCohortUpdateQuery getCohortUpdateQuery,
            ICreateCohortCommand createCohortCommand,
            IUpdateCohortCommand updateCohortCommand,
            IDeleteCohortCommand deleteCohortCommand) : base(uow, codeGen, mapper)
        {
            _getCohortsListQuery = getCohortsListQuery;
            _getCohortDetailQuery = getCohortDetailQuery;
            _getCohortCreateQuery = getCohortCreateQuery;
            _getCohortUpdateQuery = getCohortUpdateQuery;
            _createCohortCommand = createCohortCommand;
            _updateCohortCommand = updateCohortCommand;
            _deleteCohortCommand = deleteCohortCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] CohortFilter filter)
        {
            var result = await _getCohortsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<CohortReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getCohortDetailQuery.ExecuteAsync(code);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Cohort not found", 404));

            return Ok(ApiResponse<CohortReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getCohortCreateQuery.Execute();
            return Ok(ApiResponse<object>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CohortCreateDto dto)
        {
            var result = await _createCohortCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<CohortReadDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getCohortUpdateQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Cohort not found", 404));

            return Ok(ApiResponse<CohortUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CohortUpdateDto dto)
        {
            var result = await _updateCohortCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<CohortReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteCohortCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}