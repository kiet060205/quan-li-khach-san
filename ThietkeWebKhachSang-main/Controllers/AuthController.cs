using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly HotelDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(HotelDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // 1. Tìm user trong database (Dựa theo dữ liệu mẫu trong file SQL của bạn)
            var user = await _context.Users
                .Include(u => u.Role) // Lấy kèm thông tin chức vụ (Admin, Guest...)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            // 2. Kiểm tra tài khoản và mật khẩu
            // Lưu ý: Trong SQL mẫu của bạn, mật khẩu đang lưu là "hash1", "hash2"...
            if (user == null || user.PasswordHash != request.Password)
            {
                return Unauthorized(new { Message = "Email hoặc mật khẩu không đúng!" });
            }

            // 3. Tạo các thông tin (Claims) để nhét vào Token
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? "Guest")
            };

            // 4. Mã hóa Token
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2), // Token có hạn 2 tiếng
                signingCredentials: creds
            );

            return Ok(new
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Role = user.Role?.Name,
                Message = "Đăng nhập thành công"
            });
        }
    }
}