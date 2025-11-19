using Microsoft.AspNetCore.Mvc;
using TheraTrackMini.Api.Data;

namespace TheraTrackMini.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var ok = await db.Database.CanConnectAsync();
        return Ok(new { status = "OK", db = ok ? "Up" : "Down" });
    }
}
