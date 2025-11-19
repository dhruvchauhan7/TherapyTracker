using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheraTrackMini.Api.Data;
using TheraTrackMini.Api.Models;

namespace TheraTrackMini.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CliniciansController : ControllerBase
{
    private readonly AppDbContext _db;
    public CliniciansController(AppDbContext db) { _db = db; }

    // Admin only: list available clinicians
    [HttpGet]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetClinicians()
    {
        var list = await _db.Users
            .Where(u => u.Role == UserRole.CLINICIAN)
            .Select(u => new { id = u.Id, name = u.Name, email = u.Email })
            .ToListAsync();

        return Ok(list);
    }
}
