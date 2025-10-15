using System;

namespace ThesisManagement.Api.Models
{
    public class CommitteeTag
    {
        public int CommitteeTagID { get; set; }
        public int CommitteeID { get; set; }
        public string CommitteeCode { get; set; } = null!;
        public int TagID { get; set; }
        public string TagCode { get; set; } = null!;
        public DateTime CreatedAt { get; set; }

        public Committee? Committee { get; set; }
        public Tag? Tag { get; set; }
    }
}
