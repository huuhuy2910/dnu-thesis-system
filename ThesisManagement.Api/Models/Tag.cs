using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class Tag
    {
        public int TagID { get; set; }
        public string TagCode { get; set; } = null!;
        public string TagName { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public ICollection<CatalogTopicTag>? CatalogTopicTags { get; set; }
        public ICollection<TopicTag>? TopicTags { get; set; }
        public ICollection<CommitteeTag>? CommitteeTags { get; set; }
        public ICollection<LecturerTag>? LecturerTags { get; set; }
    }
}