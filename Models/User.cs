using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace HotelManagementApi.Models;

public partial class User
{
    public int Id { get; set; }

    public int? RoleId { get; set; }

    public int? MembershipId { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string PasswordHash { get; set; } = null!;

    public bool? Status { get; set; }

    [JsonIgnore]
    public virtual ICollection<Article> Articles { get; set; } = new List<Article>();

    [JsonIgnore]
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    [JsonIgnore]
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    [JsonIgnore]
    public virtual Membership? Membership { get; set; }

    [JsonIgnore]
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    [JsonIgnore]
    public virtual Role? Role { get; set; }
}