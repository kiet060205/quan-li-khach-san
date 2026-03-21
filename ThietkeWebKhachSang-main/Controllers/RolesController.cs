// Sinh viên thực hiện: Võ Trần Minh Thắng - MSSV: 123001472
using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bảo mật bằng Token
    public class RolesController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public RolesController(HotelDbContext context)
        {
            _context = context;
        }

        // POST: api/Roles/assign-permission
        [HttpPost("assign-permission")]
        public async Task<IActionResult> AssignPermission([FromBody] AssignPermissionRequest request)
        {
            // 1. Tìm Role (kèm theo danh sách các quyền nó đang có)
            var role = await _context.Roles
                .Include(r => r.Permissions) // Gọi trực tiếp từ Role sang Permission
                .FirstOrDefaultAsync(r => r.Id == request.RoleId);

            if (role == null) return NotFound(new { Message = "Chức vụ (Role) không tồn tại." });

            // 2. Tìm Permission
            var permission = await _context.Permissions.FindAsync(request.PermissionId);
            if (permission == null) return NotFound(new { Message = "Quyền (Permission) không tồn tại." });

            // 3. Kiểm tra xem quyền này đã được cấp chưa
            if (role.Permissions.Any(p => p.Id == request.PermissionId))
            {
                return BadRequest(new { Message = "Quyền này đã được cấp cho chức vụ này từ trước rồi." });
            }

            // 4. Cấp quyền (EF Core sẽ tự động chèn dữ liệu vào bảng SQL Role_Permissions cho bạn)
            role.Permissions.Add(permission);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cấp quyền thành công!" });
        }

        // GET: api/Roles/my-permissions
        [HttpGet("my-permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            // 1. Lấy ID của người dùng từ Token
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { Message = "Không xác định được người dùng." });
            }

            // 2. Tìm User trong Database, lôi luôn Role và danh sách Permissions của Role đó ra
            var user = await _context.Users
                .Include(u => u.Role)
                    .ThenInclude(r => r.Permissions) // Nối thẳng qua bảng Quyền
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || user.Role == null)
            {
                return Ok(new { Message = "Bạn chưa được phân quyền.", Permissions = new string[] { } });
            }

            // 3. Lấy ra danh sách tên các quyền
            var myPermissions = user.Role.Permissions.Select(p => p.Name).ToList();

            return Ok(new 
            { 
                RoleId = user.RoleId,
                RoleName = user.Role.Name,
                TotalPermissions = myPermissions.Count,
                Permissions = myPermissions 
            });
        }
    }

    public class AssignPermissionRequest
    {
        public int RoleId { get; set; }
        public int PermissionId { get; set; }
    }
}