namespace TheraTrackMini.Api.Models;

public record ClientDto(int Id, string Name, int? AssignedClinicianId);
public record CreateClientRequest(string Name, int? AssignedClinicianId);
public record UpdateClientRequest(string Name, int? AssignedClinicianId);
