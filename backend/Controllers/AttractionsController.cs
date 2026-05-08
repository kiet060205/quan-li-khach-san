using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Khóa API
    public class AttractionsController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public AttractionsController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/Attractions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Attraction>>> GetAttractions()
        {
            return await _context.Attractions.ToListAsync();
        }

        // POST: api/Attractions
        [HttpPost]
        public async Task<ActionResult<Attraction>> CreateAttraction(Attraction attraction)
        {
            _context.Attractions.Add(attraction);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Thêm địa điểm thành công", Data = attraction });
        }

        // PUT: api/Attractions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAttraction(int id, Attraction attraction)
        {
            if (id != attraction.Id) return BadRequest(new { Message = "ID không khớp." });

            _context.Entry(attraction).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AttractionExists(id)) return NotFound();
                else throw;
            }

            return Ok(new { Message = "Cập nhật địa điểm thành công" });
        }

        // DELETE: api/Attractions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttraction(int id)
        {
            var attraction = await _context.Attractions.FindAsync(id);
            if (attraction == null) return NotFound();

            _context.Attractions.Remove(attraction);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xóa địa điểm." });
        }

        private bool AttractionExists(int id)
        {
            return _context.Attractions.Any(e => e.Id == id);
        }
    }
}