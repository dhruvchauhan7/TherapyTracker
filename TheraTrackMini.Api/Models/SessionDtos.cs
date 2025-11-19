namespace TheraTrackMini.Api.Models;

public record SessionDto(
    int Id,
    int ClientId,
    int ClinicianId,
    DateTimeOffset StartTime,
    DateTimeOffset? EndTime,
    SessionStatus Status,
    bool LockedForPayroll
);

public record CreateSessionRequest(
    int ClientId,
    int ClinicianId,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime
);

public record UpdateSessionStatusRequest(SessionStatus Status);
