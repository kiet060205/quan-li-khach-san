using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AuditLogsController : ControllerBase
    {
        private readonly HotelDbContext _context;
        public AuditLogsController(HotelDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<object>> GetAuditLogs()
        {
            var logs = await _context.AuditLogs
                .Include(a => a.User)
                    .ThenInclude(u => u!.Role)
                .OrderByDescending(a => a.CreatedAt)
                .Take(500)
                .ToListAsync();

            var events = logs.Select(a => {
                object? oldData = null;
                object? newData = null;

                try { if (!string.IsNullOrEmpty(a.OldValue)) oldData = JsonSerializer.Deserialize<object>(a.OldValue); } catch { }
                try { if (!string.IsNullOrEmpty(a.NewValue)) newData = JsonSerializer.Deserialize<object>(a.NewValue); } catch { }

                var userName = a.User?.FullName ?? "Hệ thống";
                var roleName = a.User?.Role?.Name ?? "";
                var actorLabel = string.IsNullOrEmpty(roleName) ? userName : $"{userName} ({roleName})";

                var actionLabel = a.Action?.ToUpper() switch
                {
                    "CREATE" => "Tạo mới",
                    "UPDATE" => "Cập nhật",
                    "DELETE" => "Xóa",
                    _ => a.Action
                };

                return new
                {
                    eventId   = a.Id.ToString(),
                    timestamp = a.CreatedAt,
                    actionType = a.Action,
                    entityType = a.TableName,
                    actor = actorLabel,
                    context = new { recordId = a.RecordId },
                    changes = new
                    {
                        oldData = oldData,
                        newData = newData
                    },
                    message = $"{actionLabel} {a.TableName} (ID: {a.RecordId}) bởi {actorLabel}"
                };
            }).ToList();

            var result = new
            {
                TotalEvents = events.Count,
                Events = events
            };

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAuditLog(int id)
        {
            var log = await _context.AuditLogs.FindAsync(id);
            if (log == null) return NotFound(new { Message = "Không tìm thấy nhật ký này." });

            _context.AuditLogs.Remove(log);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã xóa nhật ký hệ thống." });
        }
    }
}
