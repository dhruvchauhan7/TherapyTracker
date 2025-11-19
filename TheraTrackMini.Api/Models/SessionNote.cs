using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TheraTrackMini.Api.Models;

public class SessionNote
{
    public int Id { get; set; }
    [Required] public int SessionId { get; set; }
    [ForeignKey(nameof(SessionId))] public Session Session { get; set; } = null!;
    [Required] public string SoapText { get; set; } = null!;
}
