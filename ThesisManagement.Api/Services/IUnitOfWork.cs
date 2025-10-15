using ThesisManagement.Api.Models;
using ThesisManagement.Api.Repositories;

namespace ThesisManagement.Api.Services
{
    public interface IUnitOfWork
    {
        IGenericRepository<Department> Departments { get; }
        IGenericRepository<User> Users { get; }
        IGenericRepository<StudentProfile> StudentProfiles { get; }
        IGenericRepository<LecturerProfile> LecturerProfiles { get; }
        IGenericRepository<CatalogTopic> CatalogTopics { get; }
        IGenericRepository<Topic> Topics { get; }
        IGenericRepository<ProgressMilestone> ProgressMilestones { get; }
        IGenericRepository<ProgressSubmission> ProgressSubmissions { get; }
    IGenericRepository<MilestoneTemplate> MilestoneTemplates { get; }
    IGenericRepository<MilestoneStateHistory> MilestoneStateHistories { get; }
    IGenericRepository<SubmissionFile> SubmissionFiles { get; }
        IGenericRepository<Committee> Committees { get; }
        IGenericRepository<CommitteeMember> CommitteeMembers { get; }
        IGenericRepository<CommitteeSession> CommitteeSessions { get; }
        IGenericRepository<DefenseAssignment> DefenseAssignments { get; }
        IGenericRepository<DefenseScore> DefenseScores { get; }
        IGenericRepository<CommitteeTag> CommitteeTags { get; }
        IGenericRepository<Tag> Tags { get; }
        IGenericRepository<CatalogTopicTag> CatalogTopicTags { get; }
        IGenericRepository<TopicTag> TopicTags { get; }
        IGenericRepository<TopicLecturer> TopicLecturers { get; }
        IGenericRepository<LecturerTag> LecturerTags { get; }
        
        Task<int> SaveChangesAsync();
    }
}
