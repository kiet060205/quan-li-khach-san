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

        [HttpGet]
public async Task<IActionResult> GetRooms()
{
    try
    {
        var rooms = await _context.Rooms
            .Include(r => r.RoomType)
            .OrderByDescending(r => r.Id)
            .Select(r => new {
                id = r.Id,
                roomNumber = r.RoomNumber,
                floor = r.Floor,
                status = r.Status,
                roomType = new {
                    id = r.RoomType.Id,
                    name = r.RoomType.Name,
                    basePrice = r.RoomType.BasePrice,
                    capacityAdults = r.RoomType.CapacityAdults,
                    capacityChildren = r.RoomType.CapacityChildren
                }
            })
            .ToListAsync();

        return Ok(new { data = rooms });
    }
    catch (Exception ex)
    {
        return BadRequest(new { Message = "Lỗi khi lấy danh sách phòng: " + ex.Message });
    }
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

            _context.Rooms.AddRange(rooms);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đã thêm thành công {rooms.Count} phòng mới." });
        }
    }
}