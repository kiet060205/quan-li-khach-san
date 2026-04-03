using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LossAndDamagesController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public LossAndDamagesController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/LossAndDamages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LossAndDamageDto>>> GetLossAndDamages()
        {
            var results = await _context.LossAndDamages
                .Include(ld => ld.RoomInventory)
                    .ThenInclude(ri => ri.Room)
                .Select(ld => new LossAndDamageDto
                {
                    Id = ld.Id,
                    BookingDetailId = ld.BookingDetailId,
                    RoomInventoryId = ld.RoomInventoryId,
                    Quantity = ld.Quantity,
                    PenaltyAmount = ld.PenaltyAmount,
                    Description = ld.Description,
                    CreatedAt = ld.CreatedAt ?? DateTime.Now,
                    ItemType = ld.RoomInventory != null ? ld.RoomInventory.ItemType : "N/A",
                    RoomNumber = (ld.RoomInventory != null && ld.RoomInventory.Room != null) 
                                 ? ld.RoomInventory.Room.RoomNumber : "N/A"
                })
                .ToListAsync();

            return Ok(results);
        }

        // GET: api/LossAndDamages/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LossAndDamage>> GetLossAndDamage(int id)
        {
            var lossAndDamage = await _context.LossAndDamages.FindAsync(id);
            if (lossAndDamage == null) return NotFound(new { Message = "Không tìm thấy bản ghi đền bù" });
            return Ok(lossAndDamage);
        }

        // POST: api/LossAndDamages
        [HttpPost]
        public async Task<ActionResult<LossAndDamage>> PostLossAndDamage([FromBody] LossAndDamage lossAndDamage)
        {
            if (lossAndDamage == null) return BadRequest();
            
            if (lossAndDamage.CreatedAt == null)
                lossAndDamage.CreatedAt = DateTime.Now;

            _context.LossAndDamages.Add(lossAndDamage);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLossAndDamage), new { id = lossAndDamage.Id }, lossAndDamage);
        }

        // PUT: api/LossAndDamages/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLossAndDamage(int id, [FromBody] LossAndDamage lossAndDamage)
        {
            if (id != lossAndDamage.Id) return BadRequest(new { Message = "ID không khớp" });

            _context.Entry(lossAndDamage).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.LossAndDamages.Any(e => e.Id == id))
                    return NotFound(new { Message = "Tài liệu đền bù này đã bị xóa hoặc không còn tồn tại" });
                else throw;
            }

            return Ok(new { Message = "Cập nhật thành công", Data = lossAndDamage });
        }

        // DELETE: api/LossAndDamages/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLossAndDamage(int id)
        {
            var lossAndDamage = await _context.LossAndDamages.FindAsync(id);
            if (lossAndDamage == null) return NotFound();

            _context.LossAndDamages.Remove(lossAndDamage);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xóa bản ghi đền bù thành công" });
        }
    }

    public class LossAndDamageDto
    {
        public int Id { get; set; }
        public int? BookingDetailId { get; set; }
        public int? RoomInventoryId { get; set; }
        public int Quantity { get; set; }
        public decimal PenaltyAmount { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? ItemName { get; set; }
        public string? RoomNumber { get; set; }
         public string? ItemType { get; set; }
    }
}