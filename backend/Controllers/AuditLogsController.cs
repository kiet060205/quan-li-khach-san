using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuditLogsController : ControllerBase
    {
        private readonly HotelDbContext _context;
        public AuditLogsController(HotelDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAuditLogs()
        {
            var result = await _context.AuditLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Take(500) // Giới hạn 500 bản ghi gần nhất
                .Select(a => new {
                    a.Id,
                    a.Action,
                    a.TableName,
                    a.RecordId,
                    a.OldValue,
                    a.NewValue,
                    a.CreatedAt,
                    performedBy = a.User != null ? a.User.FullName : "Hệ thống"
                })
                .ToListAsync();
            return Ok(result);
        }
    }
}
