using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class StudentProfilesController : BaseApiController
    {
        public StudentProfilesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] StudentProfileFilter filter)
        {
            var result = await _uow.StudentProfiles.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<StudentProfileReadDto>(x));
            return Ok(ApiResponse<IEnumerable<StudentProfileReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("StudentProfile not found", 404));
            return Ok(ApiResponse<StudentProfileReadDto>.SuccessResponse(_mapper.Map<StudentProfileReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = new StudentProfileCreateDto(
                string.Empty,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "Đang học",
                null,
                null,
                null);
            return Ok(ApiResponse<StudentProfileCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] StudentProfileCreateDto dto)
        {
            // Generate StudentCode
            var code = _codeGen.Generate("STU");
            // Resolve User by Code
            var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.UserCode == dto.UserCode);
            if (user == null) return BadRequest(ApiResponse<object>.Fail("User not found", 400));
            
            // Resolve Department by Code if provided
            Department? department = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
            }
            
            var entity = new StudentProfile
            {
                StudentCode = code,
                UserCode = dto.UserCode,
                UserID = user.UserID,
                DepartmentCode = dto.DepartmentCode,
                DepartmentID = department?.DepartmentID,
                ClassCode = dto.ClassCode,
                FacultyCode = dto.FacultyCode,
                StudentImage = dto.StudentImage,
                GPA = dto.GPA,
                AcademicStanding = dto.AcademicStanding,
                Gender = dto.Gender,
                DateOfBirth = dto.DateOfBirth,
                PhoneNumber = dto.PhoneNumber,
                StudentEmail = dto.StudentEmail,
                Address = dto.Address,
                EnrollmentYear = dto.EnrollmentYear,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Đang học" : dto.Status,
                GraduationYear = dto.GraduationYear,
                Notes = dto.Notes,
                FullName = dto.FullName,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.StudentProfiles.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<StudentProfileReadDto>.SuccessResponse(_mapper.Map<StudentProfileReadDto>(entity),1,201));
        }

        [HttpGet("get-update/{code}")]
        public async Task<IActionResult> GetUpdate(string code)
        {
            var ent = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("StudentProfile not found", 404));
            var dto = new StudentProfileUpdateDto(
                ent.StudentCode,
                ent.UserCode,
                ent.DepartmentCode,
                ent.ClassCode,
                ent.FacultyCode,
                // ent.StudentImage, // Không bao gồm vì không update qua PUT
                ent.GPA,
                ent.AcademicStanding,
                ent.Gender,
                ent.DateOfBirth,
                ent.PhoneNumber,
                ent.StudentEmail,
                ent.Address,
                ent.EnrollmentYear,
                ent.Status,
                ent.GraduationYear,
                ent.Notes,
                ent.FullName);
            return Ok(ApiResponse<StudentProfileUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{code}")]
        public async Task<IActionResult> Update(string code, [FromBody] StudentProfileUpdateDto dto)
        {
            var ent = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("StudentProfile not found", 404));
            
            // Resolve User by Code if provided
            if (!string.IsNullOrWhiteSpace(dto.UserCode) && !string.Equals(dto.UserCode, ent.UserCode, StringComparison.OrdinalIgnoreCase))
            {
                var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.UserCode == dto.UserCode);
                if (user == null) return BadRequest(ApiResponse<object>.Fail("User not found", 400));
                ent.UserCode = user.UserCode;
                ent.UserID = user.UserID;
            }

            // Resolve Department by Code if provided
            Department? department = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
                if (department == null) return BadRequest(ApiResponse<object>.Fail("Department not found", 400));
            }

            ent.DepartmentCode = dto.DepartmentCode;
            ent.DepartmentID = department?.DepartmentID;
            ent.ClassCode = dto.ClassCode;
            ent.FacultyCode = dto.FacultyCode;
            // StudentImage không được update ở đây, sử dụng endpoint POST /upload-avatar thay thế
            ent.GPA = dto.GPA;
            ent.AcademicStanding = dto.AcademicStanding;
            ent.Gender = dto.Gender;
            ent.DateOfBirth = dto.DateOfBirth;
            ent.PhoneNumber = dto.PhoneNumber;
            ent.StudentEmail = dto.StudentEmail;
            ent.Address = dto.Address;
            ent.EnrollmentYear = dto.EnrollmentYear;
            ent.Status = dto.Status;
            ent.GraduationYear = dto.GraduationYear;
            ent.Notes = dto.Notes;
            if (dto.FullName != null) ent.FullName = dto.FullName;
            ent.LastUpdated = DateTime.UtcNow;
            _uow.StudentProfiles.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<StudentProfileReadDto>.SuccessResponse(_mapper.Map<StudentProfileReadDto>(ent)));
        }

        /// <summary>
        /// Upload avatar cho sinh viên
        /// </summary>
        [HttpPost("upload-avatar/{code}")]
        [Consumes("multipart/form-data")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UploadAvatar(string code, [FromForm] IFormFile file)
        {
            // Kiểm tra sinh viên có tồn tại không
            var student = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (student == null) return NotFound(ApiResponse<object>.Fail("Sinh viên không tồn tại", 404));

            // Kiểm tra file
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<object>.Fail("File ảnh là bắt buộc", 400));

            // Kiểm tra loại file (chỉ cho phép ảnh)
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest(ApiResponse<object>.Fail("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, bmp)", 400));

            // Kiểm tra kích thước file (giới hạn 5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(ApiResponse<object>.Fail("Kích thước file không được vượt quá 5MB", 400));

            // Tạo thư mục lưu ảnh nếu chưa có
            var avatarsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars", "students");
            if (!Directory.Exists(avatarsRoot)) Directory.CreateDirectory(avatarsRoot);

            // Xóa ảnh cũ nếu có
            if (!string.IsNullOrEmpty(student.StudentImage))
            {
                var oldImagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", student.StudentImage.TrimStart('/').Replace("/", "\\"));
                if (System.IO.File.Exists(oldImagePath))
                {
                    try
                    {
                        System.IO.File.Delete(oldImagePath);
                    }
                    catch { /* Ignore errors when deleting old file */ }
                }
            }

            // Tạo tên file duy nhất
            var uniqueName = $"{code}_{Guid.NewGuid():N}{fileExtension}";
            var savePath = Path.Combine(avatarsRoot, uniqueName);

            // Lưu file
            using (var stream = new FileStream(savePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Cập nhật đường dẫn ảnh vào database
            var imageUrl = $"/avatars/students/{uniqueName}";
            student.StudentImage = imageUrl;
            student.LastUpdated = DateTime.UtcNow;
            
            _uow.StudentProfiles.Update(student);
            await _uow.SaveChangesAsync();

            return Ok(ApiResponse<object>.SuccessResponse(new 
            { 
                studentCode = code,
                imageUrl = imageUrl,
                message = "Upload avatar thành công"
            }));
        }

        [HttpDelete("delete/{code}")]
        public async Task<IActionResult> Delete(string code)
        {
            var ent = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("StudentProfile not found", 404));
            _uow.StudentProfiles.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}
