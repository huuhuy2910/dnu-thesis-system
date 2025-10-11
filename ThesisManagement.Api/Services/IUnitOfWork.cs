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
        IGenericRepository<DefenseAssignment> DefenseAssignments { get; }
        IGenericRepository<DefenseScore> DefenseScores { get; }
        
        // New repositories for specialty-related models
        IGenericRepository<Specialty> Specialties { get; }
        IGenericRepository<LecturerSpecialty> LecturerSpecialties { get; }
        IGenericRepository<CatalogTopicSpecialty> CatalogTopicSpecialties { get; }
        IGenericRepository<TopicLecturer> TopicLecturers { get; }
        
        Task<int> SaveChangesAsync();
    }
}
