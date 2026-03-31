using AutoMapper;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Rooms;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    [Authorize(Roles = "Admin,Head")]
    [Route("api/v1/rooms")]
    public class RoomsController : BaseApiController
    {
        public RoomsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper)
            : base(uow, codeGen, mapper)
        {
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] string? keyword = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _uow.Rooms.Query();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var k = keyword.Trim().ToUpper();
                query = query.Where(x => x.RoomCode.ToUpper().Contains(k) || (x.Status != null && x.Status.ToUpper().Contains(k)));
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(x => x.RoomCode)
                .Skip((Math.Max(page, 1) - 1) * Math.Max(pageSize, 1))
                .Take(Math.Max(pageSize, 1))
                .Select(x => new RoomReadDto
                {
                    RoomID = x.RoomID,
                    RoomCode = x.RoomCode,
                    Status = x.Status,
                    CreatedAt = x.CreatedAt,
                    LastUpdated = x.LastUpdated
                })
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<RoomReadDto>>.SuccessResponse(items, total));
        }

        [HttpGet("get-detail/{id:int}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var room = await _uow.Rooms.GetByIdAsync(id);
            if (room == null)
            {
                return NotFound(ApiResponse<object>.Fail("Room not found", 404));
            }

            return Ok(ApiResponse<RoomReadDto>.SuccessResponse(new RoomReadDto
            {
                RoomID = room.RoomID,
                RoomCode = room.RoomCode,
                Status = room.Status,
                CreatedAt = room.CreatedAt,
                LastUpdated = room.LastUpdated
            }));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] RoomCreateDto dto)
        {
            if (!TryNormalizeRoomCode(dto.RoomCode, out var code, out var codeError))
            {
                return BadRequest(ApiResponse<object>.Fail(codeError!, 400));
            }

            if (!TryNormalizeRoomStatus(dto.Status, out var normalizedStatus, out var statusError))
            {
                return BadRequest(ApiResponse<object>.Fail(statusError!, 400));
            }

            var duplicated = await _uow.Rooms.Query().AnyAsync(x => x.RoomCode == code);
            if (duplicated)
            {
                return Conflict(ApiResponse<object>.Fail("RoomCode already exists", 409));
            }

            var now = DateTime.UtcNow;
            var room = new Room
            {
                RoomCode = code,
                Status = normalizedStatus,
                CreatedAt = now,
                LastUpdated = now
            };

            await _uow.Rooms.AddAsync(room);
            await _uow.SaveChangesAsync();

            return StatusCode(201, ApiResponse<RoomReadDto>.SuccessResponse(new RoomReadDto
            {
                RoomID = room.RoomID,
                RoomCode = room.RoomCode,
                Status = room.Status,
                CreatedAt = room.CreatedAt,
                LastUpdated = room.LastUpdated
            }, 1, 201));
        }

        [HttpPut("update/{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] RoomUpdateDto dto)
        {
            var room = await _uow.Rooms.GetByIdAsync(id);
            if (room == null)
            {
                return NotFound(ApiResponse<object>.Fail("Room not found", 404));
            }

            if (!TryNormalizeRoomCode(dto.RoomCode, out var code, out var codeError))
            {
                return BadRequest(ApiResponse<object>.Fail(codeError!, 400));
            }

            if (!TryNormalizeRoomStatus(dto.Status, out var normalizedStatus, out var statusError))
            {
                return BadRequest(ApiResponse<object>.Fail(statusError!, 400));
            }

            var duplicated = await _uow.Rooms.Query().AnyAsync(x => x.RoomID != id && x.RoomCode == code);
            if (duplicated)
            {
                return Conflict(ApiResponse<object>.Fail("RoomCode already exists", 409));
            }

            room.RoomCode = code;
            room.Status = normalizedStatus;
            room.LastUpdated = DateTime.UtcNow;

            _uow.Rooms.Update(room);
            await _uow.SaveChangesAsync();

            return Ok(ApiResponse<RoomReadDto>.SuccessResponse(new RoomReadDto
            {
                RoomID = room.RoomID,
                RoomCode = room.RoomCode,
                Status = room.Status,
                CreatedAt = room.CreatedAt,
                LastUpdated = room.LastUpdated
            }));
        }

        [HttpPatch("update-status/{id:int}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] RoomStatusUpdateDto dto)
        {
            var room = await _uow.Rooms.GetByIdAsync(id);
            if (room == null)
            {
                return NotFound(ApiResponse<object>.Fail("Room not found", 404));
            }

            if (!TryNormalizeRoomStatus(dto.Status, out var normalizedStatus, out var statusError))
            {
                return BadRequest(ApiResponse<object>.Fail(statusError!, 400));
            }

            room.Status = normalizedStatus;
            room.LastUpdated = DateTime.UtcNow;
            _uow.Rooms.Update(room);
            await _uow.SaveChangesAsync();

            return Ok(ApiResponse<RoomReadDto>.SuccessResponse(new RoomReadDto
            {
                RoomID = room.RoomID,
                RoomCode = room.RoomCode,
                Status = room.Status,
                CreatedAt = room.CreatedAt,
                LastUpdated = room.LastUpdated
            }));
        }

        [HttpGet("status-summary")]
        public async Task<IActionResult> GetStatusSummary()
        {
            var rooms = await _uow.Rooms.Query().AsNoTracking().ToListAsync();
            var summary = rooms
                .GroupBy(x => string.IsNullOrWhiteSpace(x.Status) ? "(Không khai báo)" : x.Status.Trim(), StringComparer.OrdinalIgnoreCase)
                .OrderBy(g => g.Key)
                .Select(g => new RoomStatusSummaryItemDto
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToList();

            return Ok(ApiResponse<IEnumerable<RoomStatusSummaryItemDto>>.SuccessResponse(summary, summary.Count));
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] string? keyword = null, [FromQuery] string? status = null)
        {
            var query = _uow.Rooms.Query().AsNoTracking();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var k = keyword.Trim().ToUpperInvariant();
                query = query.Where(x => x.RoomCode.ToUpper().Contains(k) || (x.Status != null && x.Status.ToUpper().Contains(k)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (!TryNormalizeRoomStatus(status, out var normalizedStatus, out var error))
                {
                    return BadRequest(ApiResponse<object>.Fail(error!, 400));
                }

                query = query.Where(x => x.Status == normalizedStatus);
            }

            var rooms = await query.OrderBy(x => x.RoomCode).ToListAsync();

            using var workbook = new XLWorkbook();
            var sheet = workbook.Worksheets.Add("Rooms");
            sheet.Cell(1, 1).Value = "RoomCode";
            sheet.Cell(1, 2).Value = "Status";
            sheet.Cell(1, 3).Value = "CreatedAt";
            sheet.Cell(1, 4).Value = "LastUpdated";

            for (var i = 0; i < rooms.Count; i++)
            {
                var row = i + 2;
                sheet.Cell(row, 1).Value = rooms[i].RoomCode;
                sheet.Cell(row, 2).Value = rooms[i].Status ?? string.Empty;
                sheet.Cell(row, 3).Value = rooms[i].CreatedAt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
                sheet.Cell(row, 4).Value = rooms[i].LastUpdated.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
            }

            sheet.Range(1, 1, Math.Max(1, rooms.Count + 1), 4).CreateTable();
            sheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var fileName = $"rooms_{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx";
            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpPost("import")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Import(IFormFile file, [FromQuery] bool upsert = true)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<object>.Fail("File import không hợp lệ.", 400));
            }

            var fileName = file.FileName ?? string.Empty;
            if (!fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(ApiResponse<object>.Fail("Chỉ hỗ trợ import file Excel .xlsx.", 400));
            }

            var rows = new List<(int RowNumber, string RoomCode, string? Status)>();
            using (var stream = file.OpenReadStream())
            using (var workbook = new XLWorkbook(stream))
            {
                var sheet = workbook.Worksheets.FirstOrDefault();
                if (sheet == null)
                {
                    return BadRequest(ApiResponse<object>.Fail("File Excel không có worksheet nào.", 400));
                }

                var usedRows = sheet.RangeUsed();
                if (usedRows == null)
                {
                    return BadRequest(ApiResponse<object>.Fail("File Excel rỗng.", 400));
                }

                var firstDataRow = 1;
                var headerRoomCode = sheet.Cell(1, 1).GetString();
                if (string.Equals(headerRoomCode, "RoomCode", StringComparison.OrdinalIgnoreCase))
                {
                    firstDataRow = 2;
                }

                var lastRow = usedRows.LastRowUsed().RowNumber();
                for (var rowNumber = firstDataRow; rowNumber <= lastRow; rowNumber++)
                {
                    var roomCodeRaw = sheet.Cell(rowNumber, 1).GetString();
                    var statusRaw = sheet.Cell(rowNumber, 2).GetString();
                    if (string.IsNullOrWhiteSpace(roomCodeRaw))
                    {
                        continue;
                    }

                    rows.Add((rowNumber, roomCodeRaw, string.IsNullOrWhiteSpace(statusRaw) ? null : statusRaw));
                }
            }

            if (rows.Count == 0)
            {
                return BadRequest(ApiResponse<object>.Fail("File Excel không có dữ liệu hợp lệ.", 400));
            }

            var result = new RoomImportResultDto();
            var roomsByCode = await _uow.Rooms.Query().ToDictionaryAsync(x => x.RoomCode, x => x, StringComparer.OrdinalIgnoreCase);

            foreach (var row in rows)
            {
                result.TotalRows++;
                var roomCodeRaw = row.RoomCode;
                var statusRaw = row.Status;

                if (!TryNormalizeRoomCode(roomCodeRaw, out var roomCode, out var roomCodeError))
                {
                    result.FailedCount++;
                    result.Rows.Add(new RoomImportRowResultDto
                    {
                        RowNumber = row.RowNumber,
                        RoomCode = roomCodeRaw,
                        Status = statusRaw,
                        Result = "Failed",
                        Message = roomCodeError ?? "RoomCode không hợp lệ."
                    });
                    continue;
                }

                if (!TryNormalizeRoomStatus(statusRaw, out var normalizedStatus, out var statusError))
                {
                    result.FailedCount++;
                    result.Rows.Add(new RoomImportRowResultDto
                    {
                        RowNumber = row.RowNumber,
                        RoomCode = roomCode,
                        Status = statusRaw,
                        Result = "Failed",
                        Message = statusError ?? "Status không hợp lệ."
                    });
                    continue;
                }

                if (roomsByCode.TryGetValue(roomCode, out var existing))
                {
                    if (!upsert)
                    {
                        result.FailedCount++;
                        result.Rows.Add(new RoomImportRowResultDto
                        {
                            RowNumber = row.RowNumber,
                            RoomCode = roomCode,
                            Status = normalizedStatus,
                            Result = "Failed",
                            Message = "RoomCode đã tồn tại. Bật upsert=true để cho phép cập nhật."
                        });
                        continue;
                    }

                    existing.Status = normalizedStatus;
                    existing.LastUpdated = DateTime.UtcNow;
                    _uow.Rooms.Update(existing);

                    result.UpdatedCount++;
                    result.Rows.Add(new RoomImportRowResultDto
                    {
                        RowNumber = row.RowNumber,
                        RoomCode = roomCode,
                        Status = normalizedStatus,
                        Result = "Updated",
                        Message = "Cập nhật thành công."
                    });
                    continue;
                }

                var now = DateTime.UtcNow;
                var room = new Room
                {
                    RoomCode = roomCode,
                    Status = normalizedStatus,
                    CreatedAt = now,
                    LastUpdated = now
                };

                await _uow.Rooms.AddAsync(room);
                roomsByCode[roomCode] = room;

                result.CreatedCount++;
                result.Rows.Add(new RoomImportRowResultDto
                {
                    RowNumber = row.RowNumber,
                    RoomCode = roomCode,
                    Status = normalizedStatus,
                    Result = "Created",
                    Message = "Tạo mới thành công."
                });
            }

            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<RoomImportResultDto>.SuccessResponse(result));
        }

        [HttpDelete("delete/{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var room = await _uow.Rooms.GetByIdAsync(id);
            if (room == null)
            {
                return NotFound(ApiResponse<object>.Fail("Room not found", 404));
            }

            var isInUse = await _uow.Committees.Query().AnyAsync(x => x.RoomID == id);
            if (isInUse)
            {
                return Conflict(ApiResponse<object>.Fail("Room is referenced by committees", 409));
            }

            _uow.Rooms.Remove(room);
            await _uow.SaveChangesAsync();

            return Ok(ApiResponse<object>.SuccessResponse(null));
        }

        private static bool TryNormalizeRoomCode(string? roomCode, out string normalized, out string? error)
        {
            normalized = string.Empty;
            error = null;

            if (string.IsNullOrWhiteSpace(roomCode))
            {
                error = "RoomCode là bắt buộc.";
                return false;
            }

            normalized = roomCode.Trim().ToUpperInvariant();
            if (normalized.Length > 40)
            {
                error = "RoomCode tối đa 40 ký tự.";
                return false;
            }

            return true;
        }

        private static bool TryNormalizeRoomStatus(string? status, out string? normalized, out string? error)
        {
            normalized = null;
            error = null;

            if (string.IsNullOrWhiteSpace(status))
            {
                return true;
            }

            var raw = status.Trim();
            var key = raw.ToUpperInvariant();

            normalized = key switch
            {
                "ACTIVE" => "Đang hoạt động",
                "AVAILABLE" => "Đang hoạt động",
                "HOATDONG" => "Đang hoạt động",
                "ĐANG HOẠT ĐỘNG" => "Đang hoạt động",
                "MAINTENANCE" => "Bảo trì",
                "BAOTRI" => "Bảo trì",
                "BẢO TRÌ" => "Bảo trì",
                "INACTIVE" => "Ngưng sử dụng",
                "UNAVAILABLE" => "Ngưng sử dụng",
                "NGUNG" => "Ngưng sử dụng",
                "NGƯNG" => "Ngưng sử dụng",
                "KHÔNG SỬ DỤNG" => "Ngưng sử dụng",
                _ => raw
            };

            if (normalized.Length > 50)
            {
                error = "Status tối đa 50 ký tự.";
                normalized = null;
                return false;
            }

            return true;
        }
    }
}
