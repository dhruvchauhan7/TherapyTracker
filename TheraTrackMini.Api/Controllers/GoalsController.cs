using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheraTrackMini.Api.Auth;
using TheraTrackMini.Api.Data;
using TheraTrackMini.Api.Models;

namespace TheraTrackMini.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GoalsController(AppDbContext db) : ControllerBase
{
    // GET /api/goals?clientId=123
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> Get([FromQuery] int? clientId)
    {
        var role = User.GetRole();

        var q = db.Goals
            .Include(g => g.Client)
            .AsNoTracking()
            .AsQueryable();

        if (clientId.HasValue)
            q = q.Where(g => g.ClientId == clientId.Value);

        // Clinicians can only see goals for their own clients
        if (role == nameof(UserRole.CLINICIAN))
        {
            var me = User.GetUserId();
            q = q.Where(g => g.Client.AssignedClinicianId == me);
        }

        // Return anonymous objects shaped for the Angular GoalService:
        // { id, clientId, name, unit, targetValue }
        var list = await q
            .OrderBy(g => g.ClientId)
            .ThenBy(g => g.Title)
            .Select(g => new
            {
                id = g.Id,
                clientId = g.ClientId,
                name = g.Title,           // map Title -> name
                unit = g.MeasureType,     // map MeasureType -> unit
                targetValue = (int?)null  // not in your model; keep null for now
            })
            .ToListAsync();

        return Ok(list);
    }

    // POST /api/goals (ADMIN only)
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] CreateGoalRequest req)
    {
        // ensure client exists
        var clientExists = await db.Clients.AnyAsync(c => c.Id == req.ClientId);
        if (!clientExists) return BadRequest("Client does not exist.");

        var goal = new Goal
        {
            ClientId = req.ClientId,
            Title = req.Title,
            MeasureType = req.MeasureType
        };

        db.Goals.Add(goal);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = goal.Id }, new
        {
            id = goal.Id,
            clientId = goal.ClientId,
            name = goal.Title,
            unit = goal.MeasureType,
            targetValue = (int?)null
        });
    }

    // PUT /api/goals/{id} (ADMIN only)
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<object>> Update(int id, [FromBody] UpdateGoalRequest req)
    {
        var goal = await db.Goals.FindAsync(id);
        if (goal is null) return NotFound();

        goal.Title = req.Title;
        goal.MeasureType = req.MeasureType;

        await db.SaveChangesAsync();

        return Ok(new
        {
            id = goal.Id,
            clientId = goal.ClientId,
            name = goal.Title,
            unit = goal.MeasureType,
            targetValue = (int?)null
        });
    }

    // DELETE /api/goals/{id} (ADMIN only) — optional
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var goal = await db.Goals.FindAsync(id);
        if (goal is null) return NotFound();

        db.Goals.Remove(goal);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
