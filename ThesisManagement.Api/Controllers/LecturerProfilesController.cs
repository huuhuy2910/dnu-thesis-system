using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.LecturerProfiles;
using ThesisManagement.Api.Application.Query.LecturerProfiles;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.LecturerProfiles.Command;
using ThesisManagement.Api.DTOs.LecturerProfiles.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class LecturerProfilesController : BaseApiController
    {
        private readonly IGetLecturerProfilesListQuery _getLecturerProfilesListQuery;
        private readonly IGetLecturerProfileDetailQuery _getLecturerProfileDetailQuery;
        private readonly IGetLecturerProfileCreateQuery _getLecturerProfileCreateQuery;
        private readonly IGetLecturerProfileUpdateQuery _getLecturerProfileUpdateQuery;
        private readonly IGetLecturerAvatarQuery _getLecturerAvatarQuery;
        private readonly ICreateLecturerProfileCommand _createLecturerProfileCommand;
        private readonly IUpdateLecturerProfileCommand _updateLecturerProfileCommand;
        private readonly IUploadLecturerAvatarCommand _uploadLecturerAvatarCommand;
        private readonly IDeleteLecturerProfileCommand _deleteLecturerProfileCommand;

        public LecturerProfilesController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetLecturerProfilesListQuery getLecturerProfilesListQuery,
            IGetLecturerProfileDetailQuery getLecturerProfileDetailQuery,
            IGetLecturerProfileCreateQuery getLecturerProfileCreateQuery,
            IGetLecturerProfileUpdateQuery getLecturerProfileUpdateQuery,
            IGetLecturerAvatarQuery getLecturerAvatarQuery,
            ICreateLecturerProfileCommand createLecturerProfileCommand,
            IUpdateLecturerProfileCommand updateLecturerProfileCommand,
            IUploadLecturerAvatarCommand uploadLecturerAvatarCommand,
            IDeleteLecturerProfileCommand deleteLecturerProfileCommand) : base(uow, codeGen, mapper)
        {
            _getLecturerProfilesListQuery = getLecturerProfilesListQuery;
            _getLecturerProfileDetailQuery = getLecturerProfileDetailQuery;
            _getLecturerProfileCreateQuery = getLecturerProfileCreateQuery;
            _getLecturerProfileUpdateQuery = getLecturerProfileUpdateQuery;
            _getLecturerAvatarQuery = getLecturerAvatarQuery;
            _createLecturerProfileCommand = createLecturerProfileCommand;
            _updateLecturerProfileCommand = updateLecturerProfileCommand;
            _uploadLecturerAvatarCommand = uploadLecturerAvatarCommand;
            _deleteLecturerProfileCommand = deleteLecturerProfileCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] LecturerProfileFilter filter)
        {
            var result = await _getLecturerProfilesListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<LecturerProfileReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getLecturerProfileDetailQuery.ExecuteAsync(code);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("LecturerProfile not found", 404));

            return Ok(ApiResponse<LecturerProfileReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(_getLecturerProfileCreateQuery.Execute()));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] LecturerProfileCreateDto dto)
        {
            var result = await _createLecturerProfileCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(201, ApiResponse<LecturerProfileReadDto>.SuccessResponse(result.Data, 1, 201));
        }

        [HttpGet("get-update/{code}")]
        public async Task<IActionResult> GetUpdate(string code)
        {
            var dto = await _getLecturerProfileUpdateQuery.ExecuteAsync(code);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("LecturerProfile not found", 404));

            return Ok(ApiResponse<LecturerProfileUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{code}")]
        public async Task<IActionResult> Update(string code, [FromBody] LecturerProfileUpdateDto dto)
        {
            var result = await _updateLecturerProfileCommand.ExecuteAsync(code, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<LecturerProfileReadDto>.SuccessResponse(result.Data));
        }

        /// <summary>
        /// Lấy thông tin avatar của giảng viên
        /// </summary>
        [HttpGet("get-avatar/{code}")]
        public async Task<IActionResult> GetAvatar(string code)
        {
            var avatar = await _getLecturerAvatarQuery.ExecuteAsync(code);
            if (avatar == null)
                return NotFound(ApiResponse<object>.Fail("Giảng viên không tồn tại", 404));

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                lecturerCode = code,
                hasAvatar = avatar.HasAvatar,
                imageUrl = avatar.ImageUrl,
                fullImageUrl = ToAbsoluteUrl(avatar.ImageUrl)
            }));
        }

        /// <summary>
        /// Upload avatar cho giảng viên
        /// </summary>
        [HttpPost("upload-avatar/{code}")]
        [Consumes("multipart/form-data")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UploadAvatar(string code, [FromForm] IFormFile file)
        {
            var result = await _uploadLecturerAvatarCommand.ExecuteAsync(code, file);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(new 
            { 
                lecturerCode = code,
                imageUrl = result.Data?.ImageUrl,
                message = result.Data?.Message
            }));
        }

        [HttpDelete("delete/{code}")]
        public async Task<IActionResult> Delete(string code)
        {
            var result = await _deleteLecturerProfileCommand.ExecuteAsync(code);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }

        private string? ToAbsoluteUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return null;

            if (Uri.TryCreate(url, UriKind.Absolute, out _))
                return url;

            return $"{Request.Scheme}://{Request.Host}{url}";
        }
    }
}
