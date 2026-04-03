using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ArticlesController : ControllerBase
    {
        private readonly HotelDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ArticlesController(HotelDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/Articles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Article>>> GetArticles()
        {
            return await _context.Articles
                .Include(a => a.Category)
                .Include(a => a.Author) // Lấy kèm thông tin tác giả
                .ToListAsync();
        }

        // GET: api/Articles/{slug}
        [HttpGet("{slug}")]
        public async Task<ActionResult<Article>> GetArticleBySlug(string slug)
        {
            var article = await _context.Articles
                .Include(a => a.Category)
                .Include(a => a.Author)
                .FirstOrDefaultAsync(a => a.Slug == slug);

            if (article == null) return NotFound(new { Message = "Không tìm thấy bài viết" });

            return Ok(article);
        }

        // POST: api/Articles
        [HttpPost]
        public async Task<ActionResult<Article>> CreateArticle(Article article)
        {
            // Tự động gán người viết bài là người đang đăng nhập
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdStr, out int authorId))
            {
                article.AuthorId = authorId;
            }

            article.PublishedAt = DateTime.Now;

            _context.Articles.Add(article);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đăng bài thành công!", Data = article });
        }

        // PUT: api/Articles/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateArticle(int id, Article article)
        {
            if (id != article.Id) return BadRequest("ID không khớp");

            _context.Entry(article).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Cập nhật bài viết thành công" });
        }

        // DELETE: api/Articles/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteArticle(int id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return NotFound();

            _context.Articles.Remove(article);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã xóa bài viết" });
        }

        // POST: api/Articles/{id}/thumbnail
        [HttpPost("{id}/thumbnail")]
        public async Task<IActionResult> UploadThumbnail(int id, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Vui lòng chọn ảnh.");

            var article = await _context.Articles.FindAsync(id);
            if (article == null) return NotFound("Không tìm thấy bài viết.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Directory.GetCurrentDirectory() + "/wwwroot", "thumbnails");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = "article_" + id + "_" + Guid.NewGuid().ToString().Substring(0, 8) + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            article.ThumbnailUrl = "/thumbnails/" + uniqueFileName;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Upload ảnh bìa thành công!", ThumbnailUrl = article.ThumbnailUrl });
        }
    }
}