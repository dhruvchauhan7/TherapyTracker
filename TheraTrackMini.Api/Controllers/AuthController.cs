using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheraTrackMini.Api.Data;
using TheraTrackMini.Api.Models;
using TheraTrackMini.Api.Services;
using BCrypt.Net;

namespace TheraTrackMini.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, JwtTokenService tokens) : ControllerBase
{
    // DEV ONLY: allow register to create initial users
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email))
            return Conflict("Email already exists");

        var user = new User
        {
            Name = req.Name,
            Email = req.Email,
            Role = req.Role,
            HourlyRateCents = req.HourlyRateCents,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        // issue tokens
        var access = tokens.CreateAccessToken(user);
        var (plain, hash, expires) = tokens.CreateRefreshToken();
        user.RefreshTokenHash = hash;
        user.RefreshTokenExpiresAt = expires;
        await db.SaveChangesAsync();

        return Ok(new AuthResponse(access, plain, user.Name, user.Email, user.Role.ToString()));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user is null) return Unauthorized();

        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized();

        var access = tokens.CreateAccessToken(user);
        var (plain, hash, expires) = tokens.CreateRefreshToken();
        user.RefreshTokenHash = hash;
        user.RefreshTokenExpiresAt = expires;
        await db.SaveChangesAsync();

        return Ok(new AuthResponse(access, plain, user.Name, user.Email, user.Role.ToString()));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest req)
    {
        // Get all non-expired refresh tokens from DB (DB-side filters only)
        var candidates = await db.Users
            .Where(u => u.RefreshTokenExpiresAt != null && u.RefreshTokenExpiresAt > DateTimeOffset.UtcNow)
            .ToListAsync(); // switch to in-memory below

        // Now verify the bcrypt hash in memory (EF can't translate this)
        var user = candidates.FirstOrDefault(u => tokens.VerifyRefreshToken(req.RefreshToken, u.RefreshTokenHash));

        if (user is null) return Unauthorized();

        var access = tokens.CreateAccessToken(user);
        var (plain, hash, expires) = tokens.CreateRefreshToken();
        user.RefreshTokenHash = hash;
        user.RefreshTokenExpiresAt = expires;
        await db.SaveChangesAsync();

        return Ok(new AuthResponse(access, plain, user.Name, user.Email, user.Role.ToString()));
    }

}
