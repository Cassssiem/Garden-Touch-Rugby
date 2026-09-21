using GTR.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace GTR.Domain.Entities
{
    public class ChuckerResult
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid MatchId { get; set; }
        public Match Match { get; set; } = null!;

        public int ChuckerNumber { get; set; }

        public Team? Winner { get; set; }
    }
}
