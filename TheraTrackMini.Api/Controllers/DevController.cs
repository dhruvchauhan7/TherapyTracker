using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheraTrackMini.Api.Data;
using TheraTrackMini.Api.Models;
using BCrypt.Net;

namespace TheraTrackMini.Api.Controllers;

[ApiController]
[Route("api/dev")]
public class DevController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        if (!env.IsDevelopment())
            return NotFound(); // hide in non-dev

        // Create clinician user if not exists
        var clinician = await db.Users.FirstOrDefaultAsync(u => u.Email == "clinician@example.com");
        if (clinician is null)
        {
            clinician = new User
            {
                Name = "Clinician One",
                Email = "clinician@example.com",
                Role = UserRole.CLINICIAN,
                HourlyRateCents = 3000,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Passw0rd!")
            };
            db.Users.Add(clinician);
            await db.SaveChangesAsync();
        }

        // Create a client assigned to the clinician
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Name == "Client Alpha");
        if (client is null)
        {
            client = new Client { Name = "Client Alpha", AssignedClinicianId = clinician.Id };
            db.Clients.Add(client);
            await db.SaveChangesAsync();
        }

        // Two sample goals
        if (!await db.Goals.AnyAsync(g => g.ClientId == client.Id))
        {
            db.Goals.Add(new Goal { ClientId = client.Id, Title = "Follow simple directions", MeasureType = MeasureType.PERCENT });
            db.Goals.Add(new Goal { ClientId = client.Id, Title = "Requests using words", MeasureType = MeasureType.COUNT });
            await db.SaveChangesAsync();
        }

        return Ok(new { seeded = true, clinicianEmail = "clinician@example.com", password = "Passw0rd!" });
    }
}
