using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.StudentProfiles;
using ThesisManagement.Api.Application.Query.StudentProfiles;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.StudentProfiles.Command;
using ThesisManagement.Api.DTOs.StudentProfiles.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class StudentProfilesController : BaseApiController
    {
        private readonly IGetStudentProfilesListQuery _getStudentProfilesListQuery;
        private readonly IGetStudentProfileDetailQuery _getStudentProfileDetailQuery;
        private readonly IGetStudentProfileCreateQuery _getStudentProfileCreateQuery;
        private readonly IGetStudentProfileUpdateQuery _getStudentProfileUpdateQuery;
        private readonly IGetStudentAvatarQuery _getStudentAvatarQuery;
        private readonly ICreateStudentProfileCommand _createStudentProfileCommand;
        private readonly IUpdateStudentProfileCommand _updateStudentProfileCommand;
        private readonly IUploadStudentAvatarCommand _uploadStudentAvatarCommand;
        private readonly IDeleteStudentProfileCommand _deleteStudentProfileCommand;

        public StudentProfilesController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetStudentProfilesListQuery getStudentProfilesListQuery,
            IGetStudentProfileDetailQuery getStudentProfileDetailQuery,
            IGetStudentProfileCreateQuery getStudentProfileCreateQuery,
            IGetStudentProfileUpdateQuery getStudentProfileUpdateQuery,
            IGetStudentAvatarQuery getStudentAvatarQuery,
            ICreateStudentProfileCommand createStudentProfileCommand,
            IUpdateStudentProfileCommand updateStudentProfileCommand,
            IUploadStudentAvatarCommand uploadStudentAvatarCommand,
            IDeleteStudentProfileCommand deleteStudentProfileCommand) : base(uow, codeGen, mapper)
        {
            _getStudentProfilesListQuery = getStudentProfilesListQuery;
            _getStudentProfileDetailQuery = getStudentProfileDetailQuery;
            _getStudentProfileCreateQuery = getStudentProfileCreateQuery;
            _getStudentProfileUpdateQuery = getStudentProfileUpdateQuery;
            _getStudentAvatarQuery = getStudentAvatarQuery;
            _createStudentProfileCommand = createStudentProfileCommand;
            _updateStudentProfileCommand = updateStudentProfileCommand;
            _uploadStudentAvatarCommand = uploadStudentAvatarCommand;
            _deleteStudentProfileCommand = deleteStudentProfileCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] StudentProfileFilter filter)
        {
            var result = await _getStudentProfilesListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<StudentProfileReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getStudentProfileDetailQuery.ExecuteAsync(code);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("StudentProfile not found", 404));

            return Ok(ApiResponse<StudentProfileReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getStudentProfileCreateQuery.Execute();
            return Ok(ApiResponse<StudentProfileCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] StudentProfileCreateDto dto)
        {
            var result = await _createStudentProfileCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(201, ApiResponse<StudentProfileReadDto>.SuccessResponse(result.Data, 1, 201));
        }

        [HttpGet("get-update/{code}")]
        public async Task<IActionResult> GetUpdate(string code)
        {
            var dto = await _getStudentProfileUpdateQuery.ExecuteAsync(code);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("StudentProfile not found", 404));

            return Ok(ApiResponse<StudentProfileUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{code}")]
        public async Task<IActionResult> Update(string code, [FromBody] StudentProfileUpdateDto dto)
        {
            var result = await _updateStudentProfileCommand.ExecuteAsync(code, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<StudentProfileReadDto>.SuccessResponse(result.Data));
        }

        /// <summary>
        /// Lấy thông tin avatar của sinh viên
        /// </summary>
        [HttpGet("get-avatar/{code}")]
        public async Task<IActionResult> GetAvatar(string code)
        {
            var avatar = await _getStudentAvatarQuery.ExecuteAsync(code);
            if (avatar == null)
                return NotFound(ApiResponse<object>.Fail("Sinh viên không tồn tại", 404));

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                studentCode = code,
                hasAvatar = avatar.HasAvatar,
                imageUrl = avatar.ImageUrl,
                fullImageUrl = avatar.ImageUrl != null ? $"{Request.Scheme}://{Request.Host}{avatar.ImageUrl}" : null
            }));
        }

        /// <summary>
        /// Upload avatar cho sinh viên
        /// </summary>
        [HttpPost("upload-avatar/{code}")]
        [Consumes("multipart/form-data")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UploadAvatar(string code, [FromForm] IFormFile file)
        {
            var result = await _uploadStudentAvatarCommand.ExecuteAsync(code, file);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(new 
            { 
                studentCode = code,
                imageUrl = result.Data?.ImageUrl,
                message = result.Data?.Message
            }));
        }

        [HttpDelete("delete/{code}")]
        public async Task<IActionResult> Delete(string code)
        {
            var result = await _deleteStudentProfileCommand.ExecuteAsync(code);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }
    }
}
