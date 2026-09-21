using GTR.Domain.Enums;
using System.Text.Json.Serialization;

namespace GTR.Application.Matches.Dtos
{
    public sealed class SetChuckerWinnerRequest
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public Team Winner { get; init; }
    }
}