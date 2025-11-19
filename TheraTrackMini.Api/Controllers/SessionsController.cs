// TheraTrackMini.Api/Controllers/SessionsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheraTrackMini.Api.Auth;
using TheraTrackMini.Api.Data;
using TheraTrackMini.Api.Models;
using Dtos = TheraTrackMini.Api.Dtos;

namespace TheraTrackMini.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionsController(AppDbContext db) : ControllerBase
{
    // ----------------------------------------------------
    // GET /api/sessions  (Admin = all, Clinician = own)
    // ----------------------------------------------------
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Dtos.SessionListDto>>> GetAll()
    {
        var role = User.GetRole();
        var q = db.Sessions
            .Include(s => s.Client)
            .Include(s => s.Clinician)
            .AsNoTracking()
            .AsQueryable();

        if (role == nameof(UserRole.CLINICIAN))
        {
            var me = User.GetUserId();
            q = q.Where(s => s.ClinicianId == me);
        }

        var list = await q
            .OrderByDescending(s => s.StartTime)
            .Select(s => new Dtos.SessionListDto(
                s.Id,
                s.ClientId,
                s.Client.Name,          // <-- client name
                s.ClinicianId,
                s.Clinician.Name,       // <-- FIX: was FullName
                s.StartTime,
                s.EndTime,
                s.Status,
                s.LockedForPayroll))
            .ToListAsync();

        return Ok(list);
    }

    // -----------------------------------------------------------------
    // GET /api/sessions/{id}
    // (Admin or assigned clinician) — returns note + entries as well
    // -----------------------------------------------------------------
    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Dtos.SessionDtoExtended>> GetById(int id)
    {
        var me = User.GetUserId();
        var role = User.GetRole();

        var s = await db.Sessions
            .AsNoTracking()
            .Include(x => x.Note)
            .Include(x => x.Entries)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (s is null) return NotFound();

        if (role != nameof(UserRole.ADMIN) && s.ClinicianId != me)
            return Forbid();

        var dto = new Dtos.SessionDtoExtended(
            s.Id, s.ClientId, s.ClinicianId, s.StartTime, s.EndTime, s.Status, s.LockedForPayroll,
            s.Note is null ? null : new Dtos.SessionNoteDto(s.Note.Id, s.Id, s.Note.SoapText),
            s.Entries.Select(e => new Dtos.SessionEntryDto(e.Id, e.GoalId, e.Value)).ToList()
        );
        return Ok(dto);
    }

    // -----------------------------------------
    // POST /api/sessions  (ADMIN only)
    // -----------------------------------------
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [HttpPost]
    public async Task<ActionResult<Dtos.SessionDto>> Create([FromBody] Dtos.CreateSessionRequest req)
    {
        if (!await db.Clients.AnyAsync(c => c.Id == req.ClientId))
            return BadRequest("Client not found.");
        if (!await db.Users.AnyAsync(u => u.Id == req.ClinicianId && u.Role == UserRole.CLINICIAN))
            return BadRequest("Clinician not found.");

        var session = new Session
        {
            ClientId = req.ClientId,
            ClinicianId = req.ClinicianId,
            StartTime = req.StartTime,
            EndTime = req.EndTime,
            Status = SessionStatus.SCHEDULED,
            LockedForPayroll = false
        };

        db.Sessions.Add(session);
        await db.SaveChangesAsync();

        var dto = new Dtos.SessionDto(
            session.Id, session.ClientId, session.ClinicianId,
            session.StartTime, session.EndTime, session.Status, session.LockedForPayroll);

        return CreatedAtAction(nameof(GetById), new { id = session.Id }, dto);
    }

    // -------------------------------------------------------------------------
    // PUT /api/sessions/{id} (CLINICIAN) — update status (e.g., mark completed)
    // -------------------------------------------------------------------------
    [Authorize(Roles = nameof(UserRole.CLINICIAN))]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Dtos.SessionDto>> UpdateStatus(int id, [FromBody] Dtos.UpdateSessionStatusRequest req)
    {
        var me = User.GetUserId();
        var s = await db.Sessions.FirstOrDefaultAsync(x => x.Id == id && x.ClinicianId == me);
        if (s is null) return NotFound();

        s.Status = req.Status;
        if (req.Status == SessionStatus.COMPLETED && s.EndTime == null)
            s.EndTime = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();

        return Ok(new Dtos.SessionDto(
            s.Id, s.ClientId, s.ClinicianId, s.StartTime, s.EndTime, s.Status, s.LockedForPayroll));
    }

    // -----------------------------------------------------------------------------------
    // PUT /api/sessions/{id}/status (ADMIN) — override status (e.g. reopen to SCHEDULED)
    // -----------------------------------------------------------------------------------
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<Dtos.SessionDto>> AdminSetStatus(int id, [FromBody] Dtos.UpdateSessionStatusRequest req)
    {
        var s = await db.Sessions.FirstOrDefaultAsync(x => x.Id == id);
        if (s is null) return NotFound();

        s.Status = req.Status;
        if (req.Status != SessionStatus.COMPLETED)
            s.EndTime = null;

        await db.SaveChangesAsync();

        return Ok(new Dtos.SessionDto(
            s.Id, s.ClientId, s.ClinicianId, s.StartTime, s.EndTime, s.Status, s.LockedForPayroll));
    }

    // -------------------------------------------------------------------
    // PUT /api/sessions/{id}/payroll-lock (ADMIN) — lock/unlock payroll
    // -------------------------------------------------------------------
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [HttpPut("{id:int}/payroll-lock")]
    public async Task<ActionResult<Dtos.SessionDto>> SetPayrollLock(int id, [FromBody] Dtos.SetPayrollLockRequest req)
    {
        var s = await db.Sessions.FirstOrDefaultAsync(x => x.Id == id);
        if (s is null) return NotFound();

        s.LockedForPayroll = req.Locked;
        await db.SaveChangesAsync();

        return Ok(new Dtos.SessionDto(
            s.Id, s.ClientId, s.ClinicianId, s.StartTime, s.EndTime, s.Status, s.LockedForPayroll));
    }

    // -------------------------------------------------------------
    // POST /api/sessions/{id}/entries (CLINICIAN)
    // -------------------------------------------------------------
    [Authorize(Roles = nameof(UserRole.CLINICIAN))]
    [HttpPost("{id:int}/entries")]
    public async Task<ActionResult<Dtos.SessionEntryDto>> AddEntry(int id, [FromBody] Dtos.CreateSessionEntryRequest req)
    {
        var me = User.GetUserId();
        var s = await db.Sessions
            .Include(x => x.Client)
            .FirstOrDefaultAsync(x => x.Id == id && x.ClinicianId == me);

        if (s is null) return NotFound("Session not found or not yours.");
        if (s.Status == SessionStatus.COMPLETED) return BadRequest("Session already completed (read-only).");

        var entry = new SessionEntry { SessionId = id, GoalId = req.GoalId, Value = req.Value };
        db.SessionEntries.Add(entry);
        await db.SaveChangesAsync();

        return Ok(new Dtos.SessionEntryDto(entry.Id, entry.GoalId, entry.Value));
    }

    // ---------------------------------------------------------
    // POST /api/sessions/{id}/note (CLINICIAN)
    // ---------------------------------------------------------
    [Authorize(Roles = nameof(UserRole.CLINICIAN))]
    [HttpPost("{id:int}/note")]
    public async Task<ActionResult<Dtos.SessionNoteDto>> AddNote(int id, [FromBody] Dtos.CreateSessionNoteRequest req)
    {
        var me = User.GetUserId();
        var s = await db.Sessions
            .Include(x => x.Note)
            .FirstOrDefaultAsync(x => x.Id == id && x.ClinicianId == me);

        if (s is null) return NotFound("Session not found or not yours.");
        if (s.Status == SessionStatus.COMPLETED) return BadRequest("Session already completed (read-only).");

        if (s.Note is null)
        {
            var note = new SessionNote { SessionId = id, SoapText = req.SoapText };
            db.SessionNotes.Add(note);
            await db.SaveChangesAsync();
            return Ok(new Dtos.SessionNoteDto(note.Id, id, note.SoapText));
        }
        else
        {
            s.Note.SoapText = req.SoapText;
            await db.SaveChangesAsync();
            return Ok(new Dtos.SessionNoteDto(s.Note.Id, id, s.Note.SoapText));
        }
    }
}
