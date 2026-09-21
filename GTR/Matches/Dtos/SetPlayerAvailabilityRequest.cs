namespace GTR.Application.Matches.Dtos
{
    public class SetPlayerAvailabilityRequest
    {
        public Guid PlayerId { get; set; }

        public bool IsAvailable { get; set; }
    }
}