using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TheraTrackMini.Api.Models;

public class SessionEntry
{
    public int Id { get; set; }
    [Required] public int SessionId { get; set; }
    [ForeignKey(nameof(SessionId))] public Session Session { get; set; } = null!;
    [Required] public int GoalId { get; set; }
    [ForeignKey(nameof(GoalId))] public Goal Goal { get; set; } = null!;
    // For PERCENT: 0/1. For COUNT: non-negative integer.
    public int Value { get; set; }
}
