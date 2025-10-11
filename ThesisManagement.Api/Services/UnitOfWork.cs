using ThesisManagement.Api.Data;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Repositories;

namespace ThesisManagement.Api.Services
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _db;
        public UnitOfWork(ApplicationDbContext db)
        {
            _db = db;
            Departments = new GenericRepository<Department>(_db);
            Users = new GenericRepository<User>(_db);
            StudentProfiles = new GenericRepository<StudentProfile>(_db);
            LecturerProfiles = new GenericRepository<LecturerProfile>(_db);
            CatalogTopics = new GenericRepository<CatalogTopic>(_db);
            Topics = new GenericRepository<Topic>(_db);
            ProgressMilestones = new GenericRepository<ProgressMilestone>(_db);
            ProgressSubmissions = new GenericRepository<ProgressSubmission>(_db);
            MilestoneTemplates = new GenericRepository<MilestoneTemplate>(_db);
            MilestoneStateHistories = new GenericRepository<MilestoneStateHistory>(_db);
            SubmissionFiles = new GenericRepository<SubmissionFile>(_db);
            Committees = new GenericRepository<Committee>(_db);
            CommitteeMembers = new GenericRepository<CommitteeMember>(_db);
            DefenseAssignments = new GenericRepository<DefenseAssignment>(_db);
            DefenseScores = new GenericRepository<DefenseScore>(_db);
            
            // Initialize new repositories
            Specialties = new GenericRepository<Specialty>(_db);
            LecturerSpecialties = new GenericRepository<LecturerSpecialty>(_db);
            CatalogTopicSpecialties = new GenericRepository<CatalogTopicSpecialty>(_db);
            TopicLecturers = new GenericRepository<TopicLecturer>(_db);
        }

        public IGenericRepository<Department> Departments { get; }
        public IGenericRepository<User> Users { get; }
        public IGenericRepository<StudentProfile> StudentProfiles { get; }
        public IGenericRepository<LecturerProfile> LecturerProfiles { get; }
        public IGenericRepository<CatalogTopic> CatalogTopics { get; }
        public IGenericRepository<Topic> Topics { get; }
        public IGenericRepository<ProgressMilestone> ProgressMilestones { get; }
        public IGenericRepository<ProgressSubmission> ProgressSubmissions { get; }
    public IGenericRepository<MilestoneTemplate> MilestoneTemplates { get; }
    public IGenericRepository<MilestoneStateHistory> MilestoneStateHistories { get; }
    public IGenericRepository<SubmissionFile> SubmissionFiles { get; }
        public IGenericRepository<Committee> Committees { get; }
        public IGenericRepository<CommitteeMember> CommitteeMembers { get; }
        public IGenericRepository<DefenseAssignment> DefenseAssignments { get; }
        public IGenericRepository<DefenseScore> DefenseScores { get; }
        
        // New repository properties
        public IGenericRepository<Specialty> Specialties { get; }
        public IGenericRepository<LecturerSpecialty> LecturerSpecialties { get; }
        public IGenericRepository<CatalogTopicSpecialty> CatalogTopicSpecialties { get; }
        public IGenericRepository<TopicLecturer> TopicLecturers { get; }

        public async Task<int> SaveChangesAsync()
        {
            return await _db.SaveChangesAsync();
        }
    }
}
