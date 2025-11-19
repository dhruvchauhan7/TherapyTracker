using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TheraTrackMini.Api.Models;
using BCrypt.Net;

namespace TheraTrackMini.Api.Services;

public class JwtOptions
{
    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";
    public string AccessTokenSecret { get; set; } = "";
    public string RefreshTokenSecret { get; set; } = "";
    public int AccessTokenMinutes { get; set; } = 60;
    public int RefreshTokenDays { get; set; } = 7;
}

public class JwtTokenService(IOptions<JwtOptions> opt)
{
    private readonly JwtOptions _opt = opt.Value;

    public string CreateAccessToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opt.AccessTokenSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opt.Issuer,
            audience: _opt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_opt.AccessTokenMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public (string plain, string hash, DateTimeOffset expires) CreateRefreshToken()
    {
        var plain = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var hash = BCrypt.Net.BCrypt.HashPassword(plain);
        var expires = DateTimeOffset.UtcNow.AddDays(_opt.RefreshTokenDays);
        return (plain, hash, expires);
    }

    public bool VerifyRefreshToken(string plain, string? hash) =>
        hash is not null && BCrypt.Net.BCrypt.Verify(plain, hash);
}
