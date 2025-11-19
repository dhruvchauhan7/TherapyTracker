using System.Security.Claims;

namespace TheraTrackMini.Api.Auth;

public static class UserContext
{
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == ClaimTypes.Name);
        // We put Name as DisplayName, but Sub contains Id; also check "sub"
        var subClaim = user.Claims.FirstOrDefault(c => c.Type == "sub")?.Value
                       ?? user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(subClaim, out var id)) return id;
        return null;
    }

    public static string? GetRole(this ClaimsPrincipal user) =>
        user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
}
