using System;
using System.Collections.Generic;

namespace HotelManagementApi.Models;

public partial class Attraction
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal? DistanceKm { get; set; }

    public string? Description { get; set; }

    public string? MapEmbedLink { get; set; }
}
