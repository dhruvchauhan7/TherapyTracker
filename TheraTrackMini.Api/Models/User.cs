using System.ComponentModel.DataAnnotations;

namespace TheraTrackMini.Api.Models;

public class User
{
	public int Id { get; set; }
	[Required, MaxLength(120)] public string Name { get; set; } = null!;
	[Required, MaxLength(200)] public string Email { get; set; } = null!;
	[Required] public UserRole Role { get; set; }
	public int HourlyRateCents { get; set; }
	[Required] public string PasswordHash { get; set; } = null!;
    public DateTimeOffset? RefreshTokenExpiresAt { get; set; }
    public string? RefreshTokenHash { get; set; }

}
