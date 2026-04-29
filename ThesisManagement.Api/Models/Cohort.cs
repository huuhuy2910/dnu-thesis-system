using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class Cohort
    {
        public int Id { get; set; }
        public string CohortCode { get; set; } = null!;
        public string CohortName { get; set; } = null!;
        public int StartYear { get; set; }
        public int EndYear { get; set; }
        public int Status { get; set; } = 1;
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Class>? Classes { get; set; }
    }
}