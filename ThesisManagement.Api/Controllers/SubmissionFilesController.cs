using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.SubmissionFiles;
using ThesisManagement.Api.Application.Query.SubmissionFiles;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.SubmissionFiles.Command;
using ThesisManagement.Api.DTOs.SubmissionFiles.Query;
using ThesisManagement.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

namespace ThesisManagement.Api.Controllers
{
    public class SubmissionFilesController : BaseApiController
    {
        private readonly IGetSubmissionFilesListQuery _getSubmissionFilesListQuery;
        private readonly IGetSubmissionFileDetailQuery _getSubmissionFileDetailQuery;
        private readonly IGetSubmissionFileCreateQuery _getSubmissionFileCreateQuery;
        private readonly IGetSubmissionFileUpdateQuery _getSubmissionFileUpdateQuery;
        private readonly ICreateSubmissionFileCommand _createSubmissionFileCommand;
        private readonly IUploadSubmissionFileCommand _uploadSubmissionFileCommand;
        private readonly IUpdateSubmissionFileCommand _updateSubmissionFileCommand;
        private readonly IDeleteSubmissionFileCommand _deleteSubmissionFileCommand;
        private readonly IDownloadSubmissionFileCommand _downloadSubmissionFileCommand;

        public SubmissionFilesController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetSubmissionFilesListQuery getSubmissionFilesListQuery,
            IGetSubmissionFileDetailQuery getSubmissionFileDetailQuery,
            IGetSubmissionFileCreateQuery getSubmissionFileCreateQuery,
            IGetSubmissionFileUpdateQuery getSubmissionFileUpdateQuery,
            ICreateSubmissionFileCommand createSubmissionFileCommand,
            IUploadSubmissionFileCommand uploadSubmissionFileCommand,
            IUpdateSubmissionFileCommand updateSubmissionFileCommand,
            IDeleteSubmissionFileCommand deleteSubmissionFileCommand,
            IDownloadSubmissionFileCommand downloadSubmissionFileCommand) : base(uow, codeGen, mapper)
        {
            _getSubmissionFilesListQuery = getSubmissionFilesListQuery;
            _getSubmissionFileDetailQuery = getSubmissionFileDetailQuery;
            _getSubmissionFileCreateQuery = getSubmissionFileCreateQuery;
            _getSubmissionFileUpdateQuery = getSubmissionFileUpdateQuery;
            _createSubmissionFileCommand = createSubmissionFileCommand;
            _uploadSubmissionFileCommand = uploadSubmissionFileCommand;
            _updateSubmissionFileCommand = updateSubmissionFileCommand;
            _deleteSubmissionFileCommand = deleteSubmissionFileCommand;
            _downloadSubmissionFileCommand = downloadSubmissionFileCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] SubmissionFileFilter filter)
        {
            var result = await _getSubmissionFilesListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<SubmissionFileReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{id:int}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var dto = await _getSubmissionFileDetailQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Submission file not found", 404));

            return Ok(ApiResponse<SubmissionFileReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getSubmissionFileCreateQuery.Execute();
            return Ok(ApiResponse<SubmissionFileCreateDto>.SuccessResponse(sample));
        }

    [HttpPost("create")]
    public async Task<IActionResult> Create()
        {
            SubmissionFileCreateDto? dto = null;
            IFormFile? file = null;

            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                file = form.Files.FirstOrDefault();

                string Get(string[] keys)
                {
                    foreach (var k in keys)
                    {
                        if (form.TryGetValue(k, out var v) && !StringValues.IsNullOrEmpty(v))
                            return v.ToString();
                    }
                    return string.Empty;
                }

                int submissionId = 0;
                var sid = Get(new[] { "submissionID", "SubmissionID", "submissionId" });
                int.TryParse(sid, out submissionId);

                var submissionCode = Get(new[] { "submissionCode", "SubmissionCode" });
                var fileName = Get(new[] { "fileName", "fileName" });
                long? fileSize = null;
                var fs = Get(new[] { "fileSizeBytes", "fileSizeBytes" });
                if (long.TryParse(fs, out var fsVal)) fileSize = fsVal;
                var mimeType = Get(new[] { "mimeType", "mimeType" });
                DateTime? uploadedAt = null;
                var ua = Get(new[] { "uploadedAt", "uploadedAt" });
                if (DateTime.TryParse(ua, out var uaVal)) uploadedAt = uaVal;
                var uploadedByUserCode = Get(new[] { "uploadedByUserCode", "uploadedByUserCode" });
                int? uploadedByUserID = null;
                var ub = Get(new[] { "uploadedByUserID", "uploadedByUserId", "uploadedByUserId" });
                if (int.TryParse(ub, out var ubVal)) uploadedByUserID = ubVal;

                var multipart = new SubmissionFileMultipartCreateDto(
                    submissionId,
                    submissionCode == string.Empty ? null : submissionCode,
                    fileName == string.Empty ? null : fileName,
                    fileSize,
                    mimeType == string.Empty ? null : mimeType,
                    uploadedAt,
                    uploadedByUserCode == string.Empty ? null : uploadedByUserCode,
                    uploadedByUserID);

                var multipartResult = await _createSubmissionFileCommand.ExecuteMultipartAsync(multipart, file);
                if (!multipartResult.Success)
                    return StatusCode(multipartResult.StatusCode, ApiResponse<object>.Fail(multipartResult.ErrorMessage ?? "Request failed", multipartResult.StatusCode));

                return StatusCode(201, ApiResponse<SubmissionFileReadDto>.SuccessResponse(multipartResult.Data, 1, 201));
            }
            else
            {
                dto = await Request.ReadFromJsonAsync<SubmissionFileCreateDto>() ?? throw new InvalidOperationException("Invalid JSON body");
            }

            var createResult = await _createSubmissionFileCommand.ExecuteAsync(dto!);
            if (!createResult.Success)
                return StatusCode(createResult.StatusCode, ApiResponse<object>.Fail(createResult.ErrorMessage ?? "Request failed", createResult.StatusCode));

            return StatusCode(201, ApiResponse<SubmissionFileReadDto>.SuccessResponse(createResult.Data, 1, 201));
        }

    // Accept file uploads via multipart/form-data. Use `file` for the uploaded file and form fields for metadata.
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [ApiExplorerSettings(IgnoreApi = true)] // hide from Swagger UI because Swashbuckle has trouble generating parameters for IFormFile in this signature
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] int SubmissionID, [FromForm] string? SubmissionCode, [FromForm] string? UploadedByUserCode, [FromForm] int? UploadedByUserID)
        {
            var result = await _uploadSubmissionFileCommand.ExecuteAsync(file, SubmissionID, SubmissionCode, UploadedByUserCode, UploadedByUserID);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(201, ApiResponse<SubmissionFileReadDto>.SuccessResponse(result.Data, 1, 201));
        }

        [HttpGet("get-update/{id:int}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getSubmissionFileUpdateQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Submission file not found", 404));

            return Ok(ApiResponse<SubmissionFileUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] SubmissionFileUpdateDto dto)
        {
            var result = await _updateSubmissionFileCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<SubmissionFileReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteSubmissionFileCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }

        [HttpGet("download/{id:int}")]
        public async Task<IActionResult> Download(int id)
        {
            var result = await _downloadSubmissionFileCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            var origin = Request.Headers["Origin"].ToString();
            if (!string.IsNullOrEmpty(origin))
            {
                Response.Headers.Append("Access-Control-Allow-Origin", origin);
                Response.Headers.Append("Access-Control-Allow-Credentials", "true");
            }
            else
            {
                // fallback
                Response.Headers.Append("Access-Control-Allow-Origin", "*");
            }
            if (!Response.Headers.ContainsKey("Access-Control-Expose-Headers"))
                Response.Headers.Append("Access-Control-Expose-Headers", "Content-Disposition,Content-Length,Content-Type");

            return File(result.Data!.Stream, result.Data.ContentType, result.Data.FileName);
        }
    }
}
