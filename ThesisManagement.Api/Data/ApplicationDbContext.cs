using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Linq;
using ThesisManagement.Api.Models;

namespace ThesisManagement.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> opts) : base(opts) { }

        public DbSet<Department> Departments => Set<Department>();
        public DbSet<User> Users => Set<User>();
        public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
        public DbSet<LecturerProfile> LecturerProfiles => Set<LecturerProfile>();
        public DbSet<CatalogTopic> CatalogTopics => Set<CatalogTopic>();
        public DbSet<Topic> Topics => Set<Topic>();
        public DbSet<ProgressMilestone> ProgressMilestones => Set<ProgressMilestone>();
        public DbSet<ProgressSubmission> ProgressSubmissions => Set<ProgressSubmission>();
        public DbSet<Committee> Committees => Set<Committee>();
        public DbSet<CommitteeMember> CommitteeMembers => Set<CommitteeMember>();
        public DbSet<CommitteeSession> CommitteeSessions => Set<CommitteeSession>();
        public DbSet<DefenseAssignment> DefenseAssignments => Set<DefenseAssignment>();
        public DbSet<DefenseScore> DefenseScores => Set<DefenseScore>();
        public DbSet<MilestoneStateHistory> MilestoneStateHistories => Set<MilestoneStateHistory>();
        public DbSet<CommitteeTag> CommitteeTags => Set<CommitteeTag>();
        
        // New DbSets for specialty-related models
        public DbSet<Specialty> Specialties => Set<Specialty>();
        public DbSet<LecturerSpecialty> LecturerSpecialties => Set<LecturerSpecialty>();
        public DbSet<CatalogTopicSpecialty> CatalogTopicSpecialties => Set<CatalogTopicSpecialty>();
        public DbSet<TopicLecturer> TopicLecturers => Set<TopicLecturer>();
        
        // New DbSets for Tag system
        public DbSet<Tag> Tags => Set<Tag>();
        public DbSet<CatalogTopicTag> CatalogTopicTags => Set<CatalogTopicTag>();
        public DbSet<TopicTag> TopicTags => Set<TopicTag>();
    public DbSet<LecturerTag> LecturerTags => Set<LecturerTag>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Departments
            modelBuilder.Entity<Department>(b =>
            {
                b.HasKey(x => x.DepartmentID);
                b.Property(x => x.DepartmentCode).HasMaxLength(30).IsRequired();
                b.Property(x => x.Name).HasMaxLength(200).IsRequired();
                b.HasIndex(x => x.DepartmentCode).IsUnique();
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // Users
            modelBuilder.Entity<User>(b =>
            {
                b.HasKey(x => x.UserID);
                b.Property(x => x.UserCode).HasMaxLength(40).IsRequired();
                b.HasIndex(x => x.UserCode).IsUnique();
                b.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
                b.Property(x => x.FullName).HasMaxLength(100).IsRequired();
                b.Property(x => x.Email).HasMaxLength(120);
                b.HasIndex(x => x.Email).IsUnique();
                b.Property(x => x.Role).HasMaxLength(20).IsRequired();
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // StudentProfiles
            modelBuilder.Entity<StudentProfile>(b =>
            {
                b.HasKey(x => x.StudentProfileID);
                b.Property(x => x.StudentCode).HasMaxLength(30).IsRequired();
                b.HasIndex(x => x.StudentCode).IsUnique();
                b.HasOne(x => x.User).WithOne(x => x.StudentProfile).HasForeignKey<StudentProfile>(x => x.UserID);
                b.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentID).OnDelete(DeleteBehavior.SetNull);
                b.Property(x => x.StudentImage).HasMaxLength(255);
                b.Property(x => x.FullName).HasMaxLength(150);

                // New columns added to StudentProfiles
                b.Property(x => x.Gender).HasMaxLength(10);
                b.Property(x => x.DateOfBirth).HasColumnType("date");
                b.Property(x => x.PhoneNumber).HasMaxLength(20);
                b.Property(x => x.StudentEmail).HasMaxLength(150);
                b.Property(x => x.Address).HasMaxLength(255);
                b.Property(x => x.EnrollmentYear);
                b.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Đang học");
                b.Property(x => x.GraduationYear);
                b.Property(x => x.Notes);

                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // LecturerProfiles
            modelBuilder.Entity<LecturerProfile>(b =>
            {
                b.HasKey(x => x.LecturerProfileID);
                b.Property(x => x.LecturerCode).HasMaxLength(30).IsRequired();
                b.HasIndex(x => x.LecturerCode).IsUnique();
                b.Property(x => x.Degree).HasMaxLength(50);
                b.Property(x => x.Specialties).HasMaxLength(500);
                b.Property(x => x.FullName).HasMaxLength(150);
                b.HasOne(x => x.User).WithOne(x => x.LecturerProfile).HasForeignKey<LecturerProfile>(x => x.UserCode).HasPrincipalKey<User>(x => x.UserCode);
                b.HasOne(x => x.Department).WithMany(x => x.LecturerProfiles).HasForeignKey(x => x.DepartmentCode).HasPrincipalKey(x => x.DepartmentCode);
                b.Property(x => x.GuideQuota).HasDefaultValue(10);
                b.Property(x => x.DefenseQuota).HasDefaultValue(8);
                b.Property(x => x.CurrentGuidingCount).HasDefaultValue(0);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // CatalogTopics
            modelBuilder.Entity<CatalogTopic>(b =>
            {
                b.HasKey(x => x.CatalogTopicID);
                b.Property(x => x.CatalogTopicCode).HasMaxLength(40).IsRequired();
                b.HasIndex(x => x.CatalogTopicCode).IsUnique();
                b.Property(x => x.Title).HasMaxLength(255).IsRequired();
                b.Property(x => x.Summary).HasMaxLength(1000);
                b.Property(x => x.AssignedStatus).HasMaxLength(20);
                b.HasOne(x => x.Department).WithMany(x => x.CatalogTopics).HasForeignKey(x => x.DepartmentCode).HasPrincipalKey(x => x.DepartmentCode);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // Topics
            modelBuilder.Entity<Topic>(b =>
            {
                b.ToTable("Topics", tb =>
                {
                    // Inform EF Core that triggers exist on this table so it avoids using a bare OUTPUT clause.
                    // Update the trigger names below to match the actual triggers defined in the database.
                    tb.HasTrigger("TR_Topics_Insert");
                    tb.HasTrigger("TR_Topics_Update");
                    tb.HasTrigger("TR_Topics_Delete");
                });
                b.HasKey(x => x.TopicID);
                b.Property(x => x.TopicCode).HasMaxLength(40).IsRequired();
                b.HasIndex(x => x.TopicCode).IsUnique();
                b.Property(x => x.Title).HasMaxLength(200).IsRequired();
                b.Property(x => x.Summary).HasMaxLength(1000);
                b.Property(x => x.Type).HasMaxLength(20).IsRequired();
                b.Property(x => x.Status).HasMaxLength(30).IsRequired();
                
                // Configure only the ProposerUser navigation property
                b.HasOne(x => x.ProposerUser).WithMany().HasForeignKey(x => x.ProposerUserCode).HasPrincipalKey(x => x.UserCode).OnDelete(DeleteBehavior.Restrict);
                

                
                // Property configurations
                b.Property(x => x.ProposerUserCode).HasMaxLength(40);
                b.Property(x => x.ProposerStudentCode).HasMaxLength(30);
                b.Property(x => x.SupervisorUserCode).HasMaxLength(40);
                b.Property(x => x.SupervisorLecturerCode).HasMaxLength(30);
                b.Property(x => x.CatalogTopicCode).HasMaxLength(40);
                b.Property(x => x.DepartmentCode).HasMaxLength(30);
                b.Property(x => x.SpecialtyCode).HasMaxLength(60);
                
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // ProgressMilestones
            modelBuilder.Entity<ProgressMilestone>(b =>
            {
                b.HasKey(x => x.MilestoneID);
                b.Property(x => x.MilestoneCode).HasMaxLength(60).IsRequired();
                b.HasIndex(x => x.MilestoneCode).IsUnique();
                b.HasOne(x => x.Topic).WithMany().HasForeignKey(x => x.TopicCode).HasPrincipalKey(x => x.TopicCode);
                b.Property(x => x.State).HasMaxLength(20).HasDefaultValue("NOT_STARTED");
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // MilestoneStateHistory
            modelBuilder.Entity<MilestoneStateHistory>(b =>
            {
                b.HasKey(x => x.HistoryID);
                b.Property(x => x.MilestoneCode).HasMaxLength(60);
                b.Property(x => x.TopicCode).HasMaxLength(40);
                b.Property(x => x.OldState).HasMaxLength(50);
                b.Property(x => x.NewState).HasMaxLength(50);
                b.Property(x => x.ChangedByUserCode).HasMaxLength(40);
                b.Property(x => x.ChangedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.Comment).HasMaxLength(500);
            });

            // ProgressSubmissions
            modelBuilder.Entity<ProgressSubmission>(b =>
            {
                b.HasKey(x => x.SubmissionID);
                b.Property(x => x.SubmissionCode).HasMaxLength(60).IsRequired();
                b.HasIndex(x => x.SubmissionCode).IsUnique();
                b.HasOne(x => x.Milestone).WithMany().HasForeignKey(x => x.MilestoneCode).HasPrincipalKey(x => x.MilestoneCode).OnDelete(DeleteBehavior.SetNull);
                b.HasOne(x => x.StudentUser).WithMany().HasForeignKey(x => x.StudentUserCode).HasPrincipalKey(x => x.UserCode).OnDelete(DeleteBehavior.SetNull);
                // StudentProfile navigation removed to prevent shadow properties
                // b.HasOne(x => x.StudentProfile).WithMany().HasForeignKey(x => x.StudentProfileCode).HasPrincipalKey(x => x.StudentCode).OnDelete(DeleteBehavior.SetNull);
                b.Property(x => x.SubmittedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // Committees
            modelBuilder.Entity<Committee>(b =>
            {
                b.ToTable("Committees", tb =>
                {
                    tb.HasTrigger("TR_Committees_Insert");
                    tb.HasTrigger("TR_Committees_Update");
                    tb.HasTrigger("TR_Committees_Delete");
                });
                b.HasKey(x => x.CommitteeID);
                b.Property(x => x.CommitteeCode).HasMaxLength(40).IsRequired();
                b.HasIndex(x => x.CommitteeCode).IsUnique();
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            modelBuilder.Entity<CommitteeSession>(b =>
            {
                b.ToTable("CommitteeSessions");
                b.HasKey(x => x.CommitteeSessionID);
                b.Property(x => x.CommitteeCode).HasMaxLength(40).IsRequired();
                b.Property(x => x.SessionNumber).IsRequired();
                b.Property(x => x.TopicCount).HasDefaultValue(0);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
                b.HasOne(x => x.Committee)
                    .WithMany()
                    .HasForeignKey(x => x.CommitteeCode)
                    .HasPrincipalKey(x => x.CommitteeCode)
                    .OnDelete(DeleteBehavior.Cascade);
                b.HasIndex(x => new { x.CommitteeCode, x.SessionNumber }).IsUnique();
            });

            modelBuilder.Entity<CommitteeTag>(b =>
            {
                b.ToTable("CommitteeTags", tb =>
                {
                    tb.HasTrigger("TR_CommitteeTags_Insert");
                    tb.HasTrigger("TR_CommitteeTags_Update");
                    tb.HasTrigger("TR_CommitteeTags_Delete");
                });
                b.HasKey(x => x.CommitteeTagID);
                b.Property(x => x.CommitteeID).IsRequired();
                b.Property(x => x.CommitteeCode).HasMaxLength(50).IsRequired();
                b.Property(x => x.TagID).IsRequired();
                b.Property(x => x.TagCode).HasMaxLength(50).IsRequired();
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

                b.HasOne(x => x.Committee)
                    .WithMany(x => x.CommitteeTags)
                    .HasForeignKey(x => x.CommitteeID)
                    .OnDelete(DeleteBehavior.Cascade);

                b.HasOne(x => x.Tag)
                    .WithMany(x => x.CommitteeTags)
                    .HasForeignKey(x => x.TagID)
                    .OnDelete(DeleteBehavior.Cascade);

                b.HasIndex(x => new { x.CommitteeCode, x.TagID }).IsUnique();
            });

            // CommitteeMembers with new schema
            modelBuilder.Entity<CommitteeMember>(b =>
            {
                b.ToTable("CommitteeMembers", tb =>
                {
                    tb.HasTrigger("TR_CommitteeMembers_Insert");
                    tb.HasTrigger("TR_CommitteeMembers_Update");
                    tb.HasTrigger("TR_CommitteeMembers_Delete");
                });
                b.HasKey(x => x.CommitteeMemberID);
                
                // Configure navigation properties with Code-based foreign keys
                b.HasOne(x => x.Committee).WithMany().HasForeignKey(x => x.CommitteeCode).HasPrincipalKey(x => x.CommitteeCode).OnDelete(DeleteBehavior.SetNull);
                b.HasOne(x => x.MemberUser).WithMany().HasForeignKey(x => x.MemberUserCode).HasPrincipalKey(x => x.UserCode).OnDelete(DeleteBehavior.SetNull);
                b.HasOne(x => x.MemberLecturerProfile).WithMany().HasForeignKey(x => x.MemberLecturerCode).HasPrincipalKey(x => x.LecturerCode).OnDelete(DeleteBehavior.SetNull);
                
                // Property configurations
                b.Property(x => x.CommitteeCode).HasMaxLength(40);
                b.Property(x => x.MemberLecturerCode).HasMaxLength(30);
                b.Property(x => x.MemberUserCode).HasMaxLength(40);
                b.Property(x => x.Role).HasMaxLength(100);
                b.Property(x => x.IsChair).HasDefaultValue(false);
            });

            var sessionConverter = new ValueConverter<int?, string?>(
                v => FormatSessionValue(v),
                v => ParseSessionValue(v));

            // DefenseAssignments
            modelBuilder.Entity<DefenseAssignment>(b =>
            {
                b.ToTable("DefenseAssignments", tb =>
                {
                    tb.HasTrigger("TR_DefenseAssignments_Insert");
                    tb.HasTrigger("TR_DefenseAssignments_Update");
                    tb.HasTrigger("TR_DefenseAssignments_Delete");
                });
                b.HasKey(x => x.AssignmentID);
                b.Property(x => x.AssignmentCode).HasMaxLength(60).IsRequired();
                b.HasIndex(x => x.AssignmentCode).IsUnique();
                b.HasOne(x => x.Topic).WithMany().HasForeignKey(x => x.TopicCode).HasPrincipalKey(x => x.TopicCode);
                b.HasOne(x => x.Committee).WithMany().HasForeignKey(x => x.CommitteeCode).HasPrincipalKey(x => x.CommitteeCode);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.Session)
                    .HasConversion(sessionConverter)
                    .HasMaxLength(20);
                b.Property(x => x.StartTime).HasColumnType("time(0)");
                b.Property(x => x.EndTime).HasColumnType("time(0)");
                b.Property(x => x.AssignedBy).HasMaxLength(40);
                b.Property(x => x.AssignedAt);
            });

            // DefenseScores
            modelBuilder.Entity<DefenseScore>(b =>
            {
                b.HasKey(x => x.ScoreID);
                b.Property(x => x.ScoreCode).HasMaxLength(60).IsRequired();
                b.HasIndex(x => x.ScoreCode).IsUnique();
                
                // Configure only the essential navigation property
                b.HasOne(x => x.MemberLecturerUser).WithMany().HasForeignKey(x => x.MemberLecturerUserCode).HasPrincipalKey(x => x.UserCode).OnDelete(DeleteBehavior.SetNull);
                

                
                // Property configurations
                b.Property(x => x.AssignmentCode).HasMaxLength(60);
                b.Property(x => x.MemberLecturerCode).HasMaxLength(30);
                b.Property(x => x.MemberLecturerUserCode).HasMaxLength(40);
                b.Property(x => x.Score).HasColumnType("decimal(4,2)");
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // Specialties
            modelBuilder.Entity<Specialty>(b =>
            {
                b.HasKey(x => x.SpecialtyID);
                b.Property(x => x.SpecialtyCode).HasMaxLength(60).IsRequired();
                b.HasIndex(x => x.SpecialtyCode).IsUnique();
                b.Property(x => x.Name).HasMaxLength(200).IsRequired();
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // LecturerSpecialties (Many-to-Many)
            modelBuilder.Entity<LecturerSpecialty>(b =>
            {
                b.HasKey(x => new { x.LecturerProfileID, x.SpecialtyID });
                b.HasOne(x => x.LecturerProfile).WithMany(x => x.LecturerSpecialties).HasForeignKey(x => x.LecturerProfileID);
                b.HasOne(x => x.Specialty).WithMany(x => x.LecturerSpecialties).HasForeignKey(x => x.SpecialtyID);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // CatalogTopicSpecialties (Many-to-Many)
            modelBuilder.Entity<CatalogTopicSpecialty>(b =>
            {
                b.HasKey(x => new { x.CatalogTopicID, x.SpecialtyID });
                b.HasOne(x => x.CatalogTopic).WithMany(x => x.CatalogTopicSpecialties).HasForeignKey(x => x.CatalogTopicID);
                b.HasOne(x => x.Specialty).WithMany(x => x.CatalogTopicSpecialties).HasForeignKey(x => x.SpecialtyID);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // TopicLecturers (Many-to-Many)
            modelBuilder.Entity<TopicLecturer>(b =>
            {
                b.HasKey(x => new { x.TopicID, x.LecturerProfileID });
                // Topic navigation removed to prevent shadow properties
                // b.HasOne(x => x.Topic).WithMany().HasForeignKey(x => x.TopicID);
                b.HasOne(x => x.LecturerProfile).WithMany(x => x.TopicLecturers).HasForeignKey(x => x.LecturerProfileID);
                b.Property(x => x.IsPrimary).HasDefaultValue(false);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // Tags
            modelBuilder.Entity<Tag>(b =>
            {
                b.HasKey(x => x.TagID);
                b.Property(x => x.TagCode).HasMaxLength(40).IsRequired();
                b.HasIndex(x => x.TagCode).IsUnique();
                b.Property(x => x.TagName).HasMaxLength(100).IsRequired();
                b.Property(x => x.Description).HasMaxLength(500);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // CatalogTopicTags (Many-to-Many)
            modelBuilder.Entity<CatalogTopicTag>(b =>
            {
                b.HasKey(x => new { x.CatalogTopicID, x.TagID });
                b.HasOne(x => x.CatalogTopic).WithMany(x => x.CatalogTopicTags).HasForeignKey(x => x.CatalogTopicID);
                b.HasOne(x => x.Tag).WithMany(x => x.CatalogTopicTags).HasForeignKey(x => x.TagID);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // TopicTags - handles both CatalogTopic and Topic tags
            modelBuilder.Entity<TopicTag>(b =>
            {
                b.HasKey(x => x.TopicTagID);
                b.HasOne(x => x.CatalogTopic).WithMany().HasForeignKey(x => x.CatalogTopicCode).HasPrincipalKey(x => x.CatalogTopicCode);
                // Topic navigation removed to prevent shadow properties
                // b.HasOne(x => x.Topic).WithMany().HasForeignKey(x => x.TopicCode).HasPrincipalKey(x => x.TopicCode);
                b.Property(x => x.TagID).IsRequired();
                b.Property(x => x.TagCode).HasMaxLength(50);
                b.HasOne(x => x.Tag)
                    .WithMany(x => x.TopicTags)
                    .HasForeignKey(x => x.TagID)
                    .OnDelete(DeleteBehavior.Cascade);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            modelBuilder.Entity<LecturerTag>(b =>
            {
                b.HasKey(x => new { x.LecturerProfileID, x.TagID });
                b.HasOne(x => x.LecturerProfile)
                    .WithMany(x => x.LecturerTags)
                    .HasForeignKey(x => x.LecturerProfileID);
                b.HasOne(x => x.Tag)
                    .WithMany(x => x.LecturerTags)
                    .HasForeignKey(x => x.TagID);
                b.Property(x => x.TagCode).HasMaxLength(50);
                b.Property(x => x.LecturerCode).HasMaxLength(30);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            });
        }

        private static string? FormatSessionValue(int? value)
            => value.HasValue ? value.Value.ToString() : null;

        private static int? ParseSessionValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var digits = new string(value.Where(char.IsDigit).ToArray());
            if (string.IsNullOrEmpty(digits))
            {
                return null;
            }

            return int.TryParse(digits, out var parsed) ? parsed : null;
        }
    }
}
