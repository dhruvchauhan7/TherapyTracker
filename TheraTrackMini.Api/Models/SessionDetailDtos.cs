namespace TheraTrackMini.Api.Models;

public record SessionEntryDto(int Id, int GoalId, int Value);
public record CreateSessionEntryRequest(int GoalId, int Value);

public record SessionNoteDto(int Id, int SessionId, string SoapText);
public record CreateSessionNoteRequest(string SoapText);
