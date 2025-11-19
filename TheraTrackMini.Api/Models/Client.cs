using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TheraTrackMini.Api.Models;

public class Client
{
    public int Id { get; set; }
    [Required, MaxLength(160)] public string Name { get; set; } = null!;
    public int? AssignedClinicianId { get; set; }
    [ForeignKey(nameof(AssignedClinicianId))] public User? AssignedClinician { get; set; }
    public List<Goal> Goals { get; set; } = new();
}
