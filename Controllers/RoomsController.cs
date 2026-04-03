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
        public async Task<IActionResult> GetRooms()
        {
            var rooms = await _context.Rooms
            .Include(r => r.RoomType) // Kéo theo cục dữ liệu Hạng Phòng
        .ToListAsync();
            // Đóng gói mảng rooms vào một Object có key là "data"
            return Ok(new { data = rooms });
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
        // PUT: api/Rooms/5 (Cập nhật phòng)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoom(int id, Room room)
        {
            if (id != room.Id)
            {
                return BadRequest(new { Message = "ID không khớp!" });
            }

            _context.Entry(room).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Rooms.Any(e => e.Id == id))
                {
                    return NotFound(new { Message = "Không tìm thấy phòng để sửa." });
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { Message = "Cập nhật thành công!" });
        }

        // DELETE: api/Rooms/5 (Xóa phòng)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
            {
                return NotFound(new { Message = "Không tìm thấy phòng." });
            }

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xóa phòng thành công!" });
        }
    }
}