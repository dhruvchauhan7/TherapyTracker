using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TheraTrackMini.Api.Models;

public class Goal
{
    public int Id { get; set; }
    [Required] public int ClientId { get; set; }
    [ForeignKey(nameof(ClientId))] public Client Client { get; set; } = null!;
    [Required, MaxLength(200)] public string Title { get; set; } = null!;
    [Required] public MeasureType MeasureType { get; set; }
}
