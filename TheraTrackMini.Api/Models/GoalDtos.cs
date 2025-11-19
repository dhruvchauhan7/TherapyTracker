namespace TheraTrackMini.Api.Models;

public record GoalDto(int Id, int ClientId, string Title, MeasureType MeasureType);
public record CreateGoalRequest(int ClientId, string Title, MeasureType MeasureType);
public record UpdateGoalRequest(string Title, MeasureType MeasureType);
