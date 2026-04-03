using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomInventoriesController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public RoomInventoriesController(HotelDbContext context)
        {
            _context = context;
        }

        // Lấy danh sách đồ dùng của một phòng cụ thể
        // GET: api/RoomInventories/room/{roomId}
        [HttpGet("room/{roomId}")]
        public async Task<ActionResult<IEnumerable<RoomInventory>>> GetInventoryByRoom(int roomId)
        {
            var inventories = await _context.RoomInventories
                .Where(ri => ri.RoomId == roomId)
                .ToListAsync();

            if (!inventories.Any())
            {
                return NotFound(new { Message = "Phòng này chưa có dữ liệu đồ dùng." });
            }

            return Ok(inventories);
        }

        // Thêm một đồ dùng mới vào phòng
        // POST: api/RoomInventories
        [HttpPost]
        public async Task<ActionResult<RoomInventory>> CreateRoomInventory(RoomInventory roomInventory)
        {
            _context.RoomInventories.Add(roomInventory);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Thêm đồ dùng thành công!", Data = roomInventory });
        }

        // Cập nhật thông tin đồ dùng (số lượng, giá đền bù...)
        // PUT: api/RoomInventories/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoomInventory(int id, RoomInventory roomInventory)
        {
            if (id != roomInventory.Id)
            {
                return BadRequest(new { Message = "ID không khớp." });
            }

            _context.Entry(roomInventory).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RoomInventoryExists(id))
                    return NotFound();
                else
                    throw;
            }

            return Ok(new { Message = "Cập nhật thành công!" });
        }

        // Xóa đồ dùng
        // DELETE: api/RoomInventories/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoomInventory(int id)
        {
            var roomInventory = await _context.RoomInventories.FindAsync(id);
            if (roomInventory == null)
            {
                return NotFound();
            }

            _context.RoomInventories.Remove(roomInventory);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xóa đồ dùng khỏi phòng." });
        }

        // TÍNH NĂNG ĐẶC BIỆT: Clone dữ liệu từ phòng này sang phòng khác
        // POST: api/RoomInventories/clone
        [HttpPost("clone")]
        public async Task<IActionResult> CloneInventory([FromBody] CloneInventoryRequest request)
        {
            // 1. Lấy toàn bộ đồ dùng của phòng gốc
            var sourceItems = await _context.RoomInventories
                .Where(ri => ri.RoomId == request.SourceRoomId)
                .AsNoTracking() // Không track để tạo mới hoàn toàn
                .ToListAsync();

            if (!sourceItems.Any())
                return BadRequest(new { Message = "Phòng gốc không có đồ dùng để sao chép." });

            // 2. Xóa đồ dùng cũ của phòng đích (nếu muốn ghi đè hoàn toàn - tùy logic của bạn)
            var existingTargetItems = await _context.RoomInventories
                .Where(ri => ri.RoomId == request.TargetRoomId)
                .ToListAsync();
            _context.RoomInventories.RemoveRange(existingTargetItems);

            // 3. Tạo danh sách mới cho phòng đích
            var newItems = sourceItems.Select(item => new RoomInventory
            {
                RoomId = request.TargetRoomId,
                ItemName = item.ItemName,
                Quantity = item.Quantity,
                PriceIfLost = item.PriceIfLost
            }).ToList();

            _context.RoomInventories.AddRange(newItems);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đã sao chép {newItems.Count} thiết bị sang phòng {request.TargetRoomId}." });
        }

        private bool RoomInventoryExists(int id)
        {
            return _context.RoomInventories.Any(e => e.Id == id);
        }
    }

    // Class phụ trợ để nhận dữ liệu JSON cho API Clone
    public class CloneInventoryRequest
    {
        public int SourceRoomId { get; set; }
        public int TargetRoomId { get; set; }
    }
}