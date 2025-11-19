using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheraTrackMini.Api.Auth;
using TheraTrackMini.Api.Data;
using TheraTrackMini.Api.Models;

namespace TheraTrackMini.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController(AppDbContext db) : ControllerBase
{
    // GET /api/clients
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClientDto>>> GetAll()
    {
        var role = User.GetRole();
        var q = db.Clients.AsNoTracking();

        if (role == nameof(UserRole.CLINICIAN))
        {
            var me = User.GetUserId();
            q = q.Where(c => c.AssignedClinicianId == me);
        }

        var list = await q
            .Select(c => new ClientDto(c.Id, c.Name, c.AssignedClinicianId))
            .ToListAsync();

        return Ok(list);
    }

    // POST /api/clients (ADMIN only)
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [HttpPost]
    public async Task<ActionResult<ClientDto>> Create([FromBody] CreateClientRequest req)
    {
        var client = new Client { Name = req.Name, AssignedClinicianId = req.AssignedClinicianId };
        db.Clients.Add(client);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = client.Id },
            new ClientDto(client.Id, client.Name, client.AssignedClinicianId));
    }

    // PUT /api/clients/{id} (ADMIN only)
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClientDto>> Update(int id, [FromBody] UpdateClientRequest req)
    {
        var client = await db.Clients.FindAsync(id);
        if (client is null) return NotFound();

        client.Name = req.Name;
        client.AssignedClinicianId = req.AssignedClinicianId;
        await db.SaveChangesAsync();

        return Ok(new ClientDto(client.Id, client.Name, client.AssignedClinicianId));
    }
}
