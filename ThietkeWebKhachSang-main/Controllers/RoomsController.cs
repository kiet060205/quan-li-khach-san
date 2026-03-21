// File: Controllers/RoomsController.cs
using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomsController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public RoomsController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/Rooms
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Room>>> GetRooms()
        {
            return await _context.Rooms.ToListAsync();
        }

        // POST: api/Rooms
        [HttpPost]
        public async Task<ActionResult<Room>> CreateRoom(Room room)
        {
            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRooms), new { id = room.Id }, room);
        }

        // PATCH: api/Rooms/{id}/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateRoomStatus(int id, [FromBody] string newStatus)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
            {
                return NotFound("Không tìm thấy phòng.");
            }

            room.Status = newStatus;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật trạng thái thành công!", Room = room });
        }

        // PATCH: api/Rooms/{id}/cleaning-status
        [HttpPatch("{id}/cleaning-status")]
        public async Task<IActionResult> UpdateCleaningStatus(int id, [FromBody] string cleaningStatus)
        {
            // Trong SQL bạn gộp chung vào cột status, nếu muốn tách riêng cần thêm cột vào DB
            // Tạm thời mô phỏng logic cập nhật
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return NotFound();

            room.Status = cleaningStatus; 
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã cập nhật trạng thái dọn dẹp" });
        }
    
// POST: api/Rooms/bulk-create
        [HttpPost("bulk-create")]
        public async Task<IActionResult> BulkCreateRooms([FromBody] List<Room> rooms)
        {
            if (rooms == null || !rooms.Any())
            {
                return BadRequest(new { Message = "Danh sách phòng trống. Vui lòng gửi mảng dữ liệu các phòng cần tạo." });
            }

            // Dùng AddRange để thêm một danh sách (List) vào DB cùng lúc
            _context.Rooms.AddRange(rooms);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đã thêm thành công {rooms.Count} phòng mới." });
        }
    }
}