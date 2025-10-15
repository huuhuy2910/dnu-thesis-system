using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using Microsoft.AspNetCore.Http;
using System.IO;
using Microsoft.Extensions.Primitives;

namespace ThesisManagement.Api.Controllers
{
    public class SubmissionFilesController : BaseApiController
    {
        public SubmissionFilesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper)
            : base(uow, codeGen, mapper)
        {
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] SubmissionFileFilter filter)
        {
            var result = await _uow.SubmissionFiles.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<SubmissionFileReadDto>(x));
            return Ok(ApiResponse<IEnumerable<SubmissionFileReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{id:int}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var ent = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("Submission file not found", 404));

            return Ok(ApiResponse<SubmissionFileReadDto>.SuccessResponse(_mapper.Map<SubmissionFileReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = new SubmissionFileCreateDto(0, null, string.Empty, null, null, null, null, null, null);
            return Ok(ApiResponse<SubmissionFileCreateDto>.SuccessResponse(sample));
        }

    [HttpPost("create")]
    public async Task<IActionResult> Create()
        {
            SubmissionFileCreateDto dto = null!;
            IFormFile? file = null;
            // Detect multipart/form-data
            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                file = form.Files.FirstOrDefault();

                // helper to get value case-insensitive
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

                // If file present, save and create FileURL
                string? fileUrl = null;
                string? finalFileName = fileName;
                long? finalFileSize = fileSize;
                string? finalMime = mimeType;

                if (file != null && file.Length > 0)
                {
                    var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadsRoot)) Directory.CreateDirectory(uploadsRoot);
                    var originalFileName = Path.GetFileName(file.FileName);
                    var uniqueName = $"{Guid.NewGuid():N}_{originalFileName}";
                    var savePath = Path.Combine(uploadsRoot, uniqueName);
                    using (var stream = new FileStream(savePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                    fileUrl = $"/uploads/{uniqueName}";
                    finalFileName = originalFileName;
                    finalFileSize = file.Length;
                    finalMime = file.ContentType;
                }

                dto = new SubmissionFileCreateDto(
                    submissionId,
                    submissionCode == string.Empty ? null : submissionCode,
                    fileUrl ?? string.Empty,
                    finalFileName,
                    finalFileSize,
                    finalMime,
                    uploadedAt,
                    uploadedByUserCode == string.Empty ? null : uploadedByUserCode,
                    uploadedByUserID
                );
            }
            else
            {
                // JSON body
                dto = await Request.ReadFromJsonAsync<SubmissionFileCreateDto>() ?? throw new InvalidOperationException("Invalid JSON body");
            }

            if (dto.SubmissionID <= 0)
                return BadRequest(ApiResponse<object>.Fail("SubmissionID must be greater than zero", 400));

            if (string.IsNullOrWhiteSpace(dto.FileURL))
                return BadRequest(ApiResponse<object>.Fail("FileURL is required", 400));

            var ent = new SubmissionFile
            {
                SubmissionID = dto.SubmissionID,
                SubmissionCode = dto.SubmissionCode,
                FileURL = dto.FileURL,
                FileName = dto.FileName,
                FileSizeBytes = dto.FileSizeBytes,
                MimeType = dto.MimeType,
                UploadedAt = dto.UploadedAt ?? DateTime.UtcNow,
                UploadedByUserCode = dto.UploadedByUserCode,
                UploadedByUserID = dto.UploadedByUserID
            };

            await _uow.SubmissionFiles.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<SubmissionFileReadDto>.SuccessResponse(_mapper.Map<SubmissionFileReadDto>(ent), 1, 201));
        }

    // Accept file uploads via multipart/form-data. Use `file` for the uploaded file and form fields for metadata.
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [ApiExplorerSettings(IgnoreApi = true)] // hide from Swagger UI because Swashbuckle has trouble generating parameters for IFormFile in this signature
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] int SubmissionID, [FromForm] string? SubmissionCode, [FromForm] string? UploadedByUserCode, [FromForm] int? UploadedByUserID)
        {
            if (SubmissionID <= 0)
                return BadRequest(ApiResponse<object>.Fail("SubmissionID must be greater than zero", 400));

            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<object>.Fail("File is required", 400));

            // ensure uploads folder exists under wwwroot
            var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsRoot)) Directory.CreateDirectory(uploadsRoot);

            var originalFileName = Path.GetFileName(file.FileName);
            var uniqueName = $"{Guid.NewGuid():N}_{originalFileName}";
            var savePath = Path.Combine(uploadsRoot, uniqueName);

            using (var stream = new FileStream(savePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // file URL exposed relative to web root
            var fileUrl = $"/uploads/{uniqueName}";

            var ent = new SubmissionFile
            {
                SubmissionID = SubmissionID,
                SubmissionCode = SubmissionCode,
                FileURL = fileUrl,
                FileName = originalFileName,
                FileSizeBytes = file.Length,
                MimeType = file.ContentType,
                UploadedAt = DateTime.UtcNow,
                UploadedByUserCode = UploadedByUserCode,
                UploadedByUserID = UploadedByUserID
            };

            await _uow.SubmissionFiles.AddAsync(ent);
            await _uow.SaveChangesAsync();

            return StatusCode(201, ApiResponse<SubmissionFileReadDto>.SuccessResponse(_mapper.Map<SubmissionFileReadDto>(ent), 1, 201));
        }

        [HttpGet("get-update/{id:int}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("Submission file not found", 404));

            var dto = new SubmissionFileUpdateDto(ent.FileURL, ent.FileName, ent.FileSizeBytes, ent.MimeType, ent.UploadedAt, ent.UploadedByUserCode, ent.UploadedByUserID);
            return Ok(ApiResponse<SubmissionFileUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] SubmissionFileUpdateDto dto)
        {
            var ent = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("Submission file not found", 404));

            if (!string.IsNullOrWhiteSpace(dto.FileURL))
                ent.FileURL = dto.FileURL;

            if (dto.FileName != null)
                ent.FileName = dto.FileName;

            if (dto.FileSizeBytes.HasValue)
                ent.FileSizeBytes = dto.FileSizeBytes;

            if (dto.MimeType != null)
                ent.MimeType = dto.MimeType;

            if (dto.UploadedAt.HasValue)
                ent.UploadedAt = dto.UploadedAt;

            if (dto.UploadedByUserCode != null)
                ent.UploadedByUserCode = dto.UploadedByUserCode;

            if (dto.UploadedByUserID.HasValue)
                ent.UploadedByUserID = dto.UploadedByUserID;

            _uow.SubmissionFiles.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<SubmissionFileReadDto>.SuccessResponse(_mapper.Map<SubmissionFileReadDto>(ent)));
        }

        [HttpDelete("delete/{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("Submission file not found", 404));

            _uow.SubmissionFiles.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }

        [HttpGet("download/{id:int}")]
        public async Task<IActionResult> Download(int id)
        {
            var ent = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Submission file not found", 404));

            // FileURL is stored like "/uploads/{uniqueName}"
            var url = ent.FileURL;
            if (string.IsNullOrWhiteSpace(url)) return NotFound(ApiResponse<object>.Fail("File URL not set", 404));

            // Map to physical path
            var relative = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var physical = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relative.Substring("uploads".Length).TrimStart(Path.DirectorySeparatorChar));

            // If ent.FileURL already contains uploads path (/uploads/...), build path directly
            if (!physical.Contains("uploads"))
            {
                physical = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", url.TrimStart('/'));
            }

            if (!System.IO.File.Exists(physical))
                return NotFound(ApiResponse<object>.Fail("File not found on disk", 404));

            var stream = System.IO.File.OpenRead(physical);
            var contentType = ent.MimeType ?? "application/octet-stream";
            var fileName = ent.FileName ?? Path.GetFileName(physical);

            // For browsers that send Origin + credentials, mirror the Origin and allow credentials.
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

            return File(stream, contentType, fileName);
        }
    }
}
