namespace TheraTrackMini.Api.Models;

public record RegisterRequest(string Name, string Email, string Password, UserRole Role, int HourlyRateCents);
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);

public record AuthResponse(string AccessToken, string RefreshToken, string Name, string Email, string Role);
