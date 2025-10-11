using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class Topic
    {
        public int TopicID { get; set; }
        public string TopicCode { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Summary { get; set; }
        public string Type { get; set; } = null!;
        public int ProposerUserID { get; set; } // Keep for internal use
        public string? ProposerUserCode { get; set; } // New: reference by code
        public string? ProposerStudentCode { get; set; } // New: reference by code
    public int? ProposerStudentProfileID { get; set; } // internal reference to student profile
        public int? SupervisorUserID { get; set; } // Keep for internal use
        public string? SupervisorUserCode { get; set; } // New: reference by code
        public string? SupervisorLecturerCode { get; set; } // New: reference by code
    public int? SupervisorLecturerProfileID { get; set; } // internal reference to lecturer profile
        public int? CatalogTopicID { get; set; } // Keep for internal use
        public string? CatalogTopicCode { get; set; } // New: reference by code
        public int? DepartmentID { get; set; } // Keep for internal use
        public string? DepartmentCode { get; set; } // New: reference by code
        public string Status { get; set; } = null!;
        public int? ResubmitCount { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? LastUpdated { get; set; }
        public int? SpecialtyID { get; set; } // Keep for internal use
        public string? SpecialtyCode { get; set; } // New: reference by code

        // Navigation properties - Only keep essential ones to avoid shadow properties
        public User? ProposerUser { get; set; }
    }
}
