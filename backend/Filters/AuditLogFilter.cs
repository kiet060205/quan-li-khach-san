using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;
using System.Text.Json;

namespace HotelManagementApi.Filters
{
    /// <summary>
    /// Tự động ghi nhật ký cho mọi hành động tạo mới / cập nhật / xóa
    /// trên toàn bộ hệ thống mà không cần sửa từng controller.
    /// </summary>
    public class AuditLogFilter : IAsyncActionFilter
    {
        private readonly HotelDbContext _context;

        public AuditLogFilter(HotelDbContext context)
        {
            _context = context;
        }

        // Bảng ánh xạ: tên controller -> tên bảng dữ liệu thân thiện
        private static readonly Dictionary<string, string> TABLE_MAP = new(StringComparer.OrdinalIgnoreCase)
        {
            { "Attractions",       "Attraction"       },
            { "Bookings",          "Booking"          },
            { "Rooms",             "Room"             },
            { "RoomTypes",         "RoomType"         },
            { "RoomInventories",   "RoomInventory"    },
            { "Users",             "User"             },
            { "UserManagement",    "User"             },
            { "Roles",             "Role"             },
            { "Permissions",       "Permission"       },
            { "Invoices",          "Invoice"          },
            { "Payments",          "Payment"          },
            { "OrderServices",     "OrderService"     },
            { "Equipments",        "Equipment"        },
            { "LossAndDamages",    "LossAndDamage"    },
            { "Services",          "Service"          },
            { "ServiceCategories", "ServiceCategory"  },
            { "Articles",          "Article"          },
            { "ArticleCategories", "ArticleCategory"  },
            { "Vouchers",          "Voucher"          },
            { "Reviews",           "Review"           },
            { "Memberships",       "Membership"       },
            { "Amenities",         "Amenity"          },
        };

        // Chỉ log các HTTP Method thay đổi dữ liệu
        private static readonly HashSet<string> LOGGED_METHODS = new(StringComparer.OrdinalIgnoreCase)
        {
            "POST", "PUT", "PATCH", "DELETE"
        };

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var method = context.HttpContext.Request.Method;

            // Chỉ xử lý request thay đổi dữ liệu
            if (!LOGGED_METHODS.Contains(method))
            {
                await next();
                return;
            }

            // Xác định tên controller
            var controllerName = context.RouteData.Values["controller"]?.ToString() ?? "Unknown";

            // Bỏ qua AuditLogs controller (không tự log chính mình) và Auth, Notifications
            if (controllerName.Equals("AuditLogs", StringComparison.OrdinalIgnoreCase)
                || controllerName.Equals("Auth", StringComparison.OrdinalIgnoreCase)
                || controllerName.Equals("Notifications", StringComparison.OrdinalIgnoreCase))
            {
                await next();
                return;
            }

            // Lấy thông tin user từ JWT token
            int? userId = null;
            var userIdClaim = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out int parsedId)) userId = parsedId;

            // Lấy tên bảng
            var tableName = TABLE_MAP.TryGetValue(controllerName, out var mapped) ? mapped : controllerName;

            // Xác định hành động
            var actionType = method.ToUpper() switch
            {
                "POST"   => "CREATE",
                "PUT"    => "UPDATE",
                "PATCH"  => "UPDATE",
                "DELETE" => "DELETE",
                _        => method.ToUpper()
            };

            // Lấy dữ liệu body (request body)
            string? requestBodyJson = null;
            try
            {
                var bodyArg = context.ActionArguments.Values.FirstOrDefault(v => v != null && !(v is int) && !(v is string));
                if (bodyArg != null)
                    requestBodyJson = JsonSerializer.Serialize(bodyArg, new JsonSerializerOptions { WriteIndented = false });
            }
            catch { /* Bỏ qua nếu không serialize được */ }

            // Lấy record ID từ route (nếu có)
            int recordId = 0;
            if (context.RouteData.Values.TryGetValue("id", out var idVal) && idVal != null)
                int.TryParse(idVal.ToString(), out recordId);

            // Thực thi action
            var executedContext = await next();

            // Chỉ ghi log nếu action thành công (2xx)
            if (executedContext.Result is ObjectResult objResult && objResult.StatusCode.HasValue)
            {
                if (objResult.StatusCode < 200 || objResult.StatusCode >= 300)
                    return;

                // Nếu là CREATE và recordId = 0, cố lấy ID từ response
                if (actionType == "CREATE" && recordId == 0)
                {
                    try
                    {
                        var resultJson = JsonSerializer.Serialize(objResult.Value);
                        using var doc = JsonDocument.Parse(resultJson);
                        var root = doc.RootElement;
                        if (root.TryGetProperty("data", out var dataEl) && dataEl.TryGetProperty("id", out var idEl))
                            recordId = idEl.GetInt32();
                        else if (root.TryGetProperty("id", out var idEl2))
                            recordId = idEl2.GetInt32();
                    }
                    catch { }
                }
            }
            else if (executedContext.Result is StatusCodeResult scr && (scr.StatusCode < 200 || scr.StatusCode >= 300))
            {
                return; // Không ghi log khi request thất bại
            }

            // Ghi nhật ký vào CSDL
            try
            {
                var log = new AuditLog
                {
                    UserId    = userId,
                    Action    = actionType,
                    TableName = tableName,
                    RecordId  = recordId,
                    NewValue  = actionType != "DELETE" ? requestBodyJson : null,
                    OldValue  = null,
                    CreatedAt = DateTime.Now
                };

                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Không để lỗi log ảnh hưởng đến luồng chính
                Console.WriteLine($"[AuditLogFilter] Lỗi ghi log: {ex.Message}");
            }
        }
    }
}
