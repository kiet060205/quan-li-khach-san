using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace HotelManagementApi.Models;

public partial class Role
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();

    [JsonIgnore]
    public virtual ICollection<Permission> Permissions { get; set; } = new List<Permission>();
}