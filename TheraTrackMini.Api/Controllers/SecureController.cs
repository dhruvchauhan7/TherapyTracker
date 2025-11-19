using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TheraTrackMini.Api.Controllers;

[ApiController]
[Route("api/secure")]
public class SecureController : ControllerBase
{
    [Authorize]
    [HttpGet("ping")]
    public IActionResult Ping() => Ok(new { ok = true, user = User.Identity?.Name });
}
