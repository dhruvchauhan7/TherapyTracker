using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TheraTrackMini.Api.Models;

public class Session
{
    public int Id { get; set; }
    [Required] public int ClientId { get; set; }
    [ForeignKey(nameof(ClientId))] public Client Client { get; set; } = null!;
    [Required] public int ClinicianId { get; set; }
    [ForeignKey(nameof(ClinicianId))] public User Clinician { get; set; } = null!;
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
    public SessionStatus Status { get; set; } = SessionStatus.SCHEDULED;
    public bool LockedForPayroll { get; set; } = false;
    public List<SessionEntry> Entries { get; set; } = new();
    public SessionNote? Note { get; set; }
}
