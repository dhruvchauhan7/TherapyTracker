// TheraTrackMini.Api/Dtos/SessionDtos.cs
using System;
using System.Collections.Generic;
using TheraTrackMini.Api.Models;

namespace TheraTrackMini.Api.Dtos
{
    // used in GET /api/sessions
    public record SessionListDto(
        int Id,
        int ClientId,
        string ClientName,
        int ClinicianId,
        string ClinicianName,
        DateTimeOffset StartTime,
        DateTimeOffset? EndTime,
        SessionStatus Status,
        bool LockedForPayroll
    );

    public record SessionDto(
        int Id,
        int ClientId,
        int ClinicianId,
        DateTimeOffset StartTime,
        DateTimeOffset? EndTime,
        SessionStatus Status,
        bool LockedForPayroll
    );

    public record SessionNoteDto(
        int Id,
        int SessionId,
        string SoapText
    );

    public record SessionEntryDto(
        int Id,
        int GoalId,
        int Value
    );

    public record SessionDtoExtended(
        int Id,
        int ClientId,
        int ClinicianId,
        DateTimeOffset StartTime,
        DateTimeOffset? EndTime,
        SessionStatus Status,
        bool LockedForPayroll,
        SessionNoteDto? Note,
        List<SessionEntryDto> Entries
    );

    public record UpdateSessionStatusRequest(SessionStatus Status);
    public record CreateSessionRequest(int ClientId, int ClinicianId, DateTimeOffset StartTime, DateTimeOffset? EndTime);
    public record CreateSessionEntryRequest(int GoalId, int Value);
    public record CreateSessionNoteRequest(string SoapText);

    public record SetPayrollLockRequest(bool Locked);
}
