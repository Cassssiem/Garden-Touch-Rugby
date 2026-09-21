using GTR.Domain.Enums;
using System.Text.Json.Serialization;

namespace GTR.Application.Matches.Dtos
{
    public sealed class AssignPlayerToTeamRequest
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public Team Team { get; init; }
    }
}