using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class CommitteeMembersController : BaseApiController
    {
        public CommitteeMembersController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] CommitteeMemberFilter filter)
        {
            var result = await _uow.CommitteeMembers.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<CommitteeMemberReadDto>(x));
            return Ok(ApiResponse<IEnumerable<CommitteeMemberReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var item = await _uow.CommitteeMembers.GetByIdAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("CommitteeMember not found", 404));
            return Ok(ApiResponse<CommitteeMemberReadDto>.SuccessResponse(_mapper.Map<CommitteeMemberReadDto>(item)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { CommitteeID = 0, LecturerUserID = 0, Role = "MEMBER" }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CommitteeMemberCreateDto dto)
        {
            // Resolve Committee by Code
            var committee = await _uow.Committees.Query().FirstOrDefaultAsync(c => c.CommitteeCode == dto.CommitteeCode);
            if (committee == null) return BadRequest(ApiResponse<object>.Fail("Committee not found", 400));
            
            // Resolve User by Code if provided
            User? user = null;
            if (!string.IsNullOrWhiteSpace(dto.MemberUserCode))
            {
                user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.UserCode == dto.MemberUserCode);
            }
            
            // Resolve LecturerProfile by Code if provided
            LecturerProfile? lecturerProfile = null;
            if (!string.IsNullOrWhiteSpace(dto.MemberLecturerCode))
            {
                lecturerProfile = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(lp => lp.LecturerCode == dto.MemberLecturerCode);
            }
            
            var ent = new CommitteeMember
            {
                CommitteeID = committee.CommitteeID,
                CommitteeCode = dto.CommitteeCode,
                MemberUserID = user?.UserID,
                MemberUserCode = dto.MemberUserCode,
                MemberLecturerProfileID = lecturerProfile?.LecturerProfileID,
                MemberLecturerCode = dto.MemberLecturerCode,
                Role = dto.Role,
                IsChair = dto.IsChair ?? false,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.CommitteeMembers.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<CommitteeMemberReadDto>.SuccessResponse(_mapper.Map<CommitteeMemberReadDto>(ent),1,201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var item = await _uow.CommitteeMembers.GetByIdAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("CommitteeMember not found", 404));
            
            return Ok(ApiResponse<CommitteeMemberUpdateDto>.SuccessResponse(new CommitteeMemberUpdateDto(item.MemberLecturerCode, item.Role, item.IsChair)));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CommitteeMemberUpdateDto dto)
        {
            var item = await _uow.CommitteeMembers.GetByIdAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("CommitteeMember not found", 404));
            
            // Resolve LecturerProfile by Code if provided
            if (!string.IsNullOrWhiteSpace(dto.MemberLecturerCode))
            {
                var lecturerProfile = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(lp => lp.LecturerCode == dto.MemberLecturerCode);
                item.MemberLecturerProfileID = lecturerProfile?.LecturerProfileID;
                item.MemberLecturerCode = dto.MemberLecturerCode;
            }
            
            item.Role = dto.Role ?? item.Role;
            item.IsChair = dto.IsChair ?? item.IsChair;
            item.LastUpdated = DateTime.UtcNow;
            _uow.CommitteeMembers.Update(item);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<CommitteeMemberReadDto>.SuccessResponse(_mapper.Map<CommitteeMemberReadDto>(item)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _uow.CommitteeMembers.GetByIdAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("CommitteeMember not found", 404));
            _uow.CommitteeMembers.Remove(item);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}
