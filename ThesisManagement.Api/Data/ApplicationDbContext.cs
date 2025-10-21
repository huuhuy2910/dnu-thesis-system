using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Linq;
using System.Text.Json;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly ICurrentUserService? _currentUserService;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> opts) : base(opts) { }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> opts, ICurrentUserService currentUserService) 
            : base(opts)
        {
            _currentUserService = currentUserService;
        }

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
        public DbSet<CommitteeTag> CommitteeTags => Set<CommitteeTag>();
        
        public DbSet<TopicLecturer> TopicLecturers => Set<TopicLecturer>();
        
        // New DbSets for Tag system
        public DbSet<Tag> Tags => Set<Tag>();
        public DbSet<CatalogTopicTag> CatalogTopicTags => Set<CatalogTopicTag>();
        public DbSet<TopicTag> TopicTags => Set<TopicTag>();
        public DbSet<LecturerTag> LecturerTags => Set<LecturerTag>();
        public DbSet<MilestoneTemplate> MilestoneTemplates => Set<MilestoneTemplate>();
        public DbSet<SubmissionFile> SubmissionFiles => Set<SubmissionFile>();
        
        // System Activity Logs
        public DbSet<SystemActivityLog> SystemActivityLogs => Set<SystemActivityLog>();

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
                b.Property(x => x.FullName).HasMaxLength(100);
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
                // New lecturer profile columns
                b.Property(x => x.Gender).HasMaxLength(10);
                b.Property(x => x.DateOfBirth).HasColumnType("date");
                b.Property(x => x.Email).HasMaxLength(100);
                b.Property(x => x.PhoneNumber).HasMaxLength(20);
                b.Property(x => x.ProfileImage).HasMaxLength(255);
                b.Property(x => x.Address).HasMaxLength(255);
                b.Property(x => x.Notes);
                b.Property(x => x.FullName).HasMaxLength(100);
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
                // Lecturer comment stored as nvarchar(max)
                b.Property(x => x.LecturerComment);
                
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
                
                // Configure CatalogTopic navigation
                b.HasOne(x => x.CatalogTopic).WithMany().HasForeignKey(x => x.CatalogTopicCode).HasPrincipalKey(x => x.CatalogTopicCode).IsRequired(false);
            });

            // ProgressMilestones
            modelBuilder.Entity<ProgressMilestone>(b =>
            {
                b.HasKey(x => x.MilestoneID);
                b.Property(x => x.MilestoneCode).HasMaxLength(60).IsRequired();
                b.HasIndex(x => x.MilestoneCode).IsUnique();
                b.HasOne(x => x.Topic).WithMany().HasForeignKey(x => x.TopicID).OnDelete(DeleteBehavior.Restrict);
                b.Property(x => x.TopicCode).HasMaxLength(60);
                b.Property(x => x.MilestoneTemplateCode).HasMaxLength(40);
                b.HasOne(x => x.MilestoneTemplate).WithMany(x => x.ProgressMilestones).HasForeignKey(x => x.MilestoneTemplateCode).HasPrincipalKey(x => x.MilestoneTemplateCode).OnDelete(DeleteBehavior.SetNull);
                b.Property(x => x.Ordinal);
                b.Property(x => x.State).HasMaxLength(50).HasDefaultValue("Chưa bắt đầu");
                b.Property(x => x.StartedAt);
                b.Property(x => x.CompletedAt1);
                b.Property(x => x.CompletedAt2);
                b.Property(x => x.CompletedAt3);
                b.Property(x => x.CompletedAt4);
                b.Property(x => x.CompletedAt5);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // ProgressSubmissions
            modelBuilder.Entity<ProgressSubmission>(b =>
            {
                // Inform EF Core that triggers exist on this table so it avoids using a bare OUTPUT clause.
                // Update the trigger names below to match the actual triggers defined in the database.
                b.ToTable("ProgressSubmissions", tb =>
                {
                    tb.HasTrigger("TR_ProgressSubmissions_Insert");
                    tb.HasTrigger("TR_ProgressSubmissions_Update");
                    tb.HasTrigger("TR_ProgressSubmissions_Delete");
                });

                b.HasKey(x => x.SubmissionID);
                b.Property(x => x.SubmissionCode).HasMaxLength(60).IsRequired();
                b.HasIndex(x => x.SubmissionCode).IsUnique();
                b.HasOne(x => x.Milestone).WithMany(x => x.ProgressSubmissions).HasForeignKey(x => x.MilestoneID).OnDelete(DeleteBehavior.SetNull);
                b.Property(x => x.MilestoneCode).HasMaxLength(60);
                b.HasOne(x => x.StudentUser).WithMany().HasForeignKey(x => x.StudentUserID).OnDelete(DeleteBehavior.SetNull);
                b.Property(x => x.StudentUserCode).HasMaxLength(40);
                b.Property(x => x.StudentProfileCode).HasMaxLength(60);
                b.Property(x => x.SubmittedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.AttemptNumber).HasDefaultValue(1);
                // File columns are stored in SubmissionFiles table; do not configure file columns on ProgressSubmission
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // MilestoneTemplates
            modelBuilder.Entity<MilestoneTemplate>(b =>
            {
                b.HasKey(x => x.MilestoneTemplateID);
                b.Property(x => x.MilestoneTemplateCode).HasMaxLength(40).IsRequired();
                b.HasIndex(x => x.MilestoneTemplateCode).IsUnique();
                b.Property(x => x.Name).HasMaxLength(200).IsRequired();
                b.Property(x => x.Description);
                b.Property(x => x.Ordinal).IsRequired();
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.LastUpdated);
            });

            // SubmissionFiles
            modelBuilder.Entity<SubmissionFile>(b =>
            {
                b.HasKey(x => x.FileID);
                b.HasOne(x => x.Submission).WithMany(x => x.SubmissionFiles).HasForeignKey(x => x.SubmissionID);
                b.Property(x => x.SubmissionCode).HasMaxLength(60);
                b.Property(x => x.FileURL).HasMaxLength(1024).IsRequired();
                b.Property(x => x.FileName).HasMaxLength(255);
                b.Property(x => x.MimeType).HasMaxLength(100);
                b.Property(x => x.UploadedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                b.Property(x => x.UploadedByUserCode).HasMaxLength(40);
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

            // Specialties - DELETED
            // LecturerSpecialties - DELETED
            // CatalogTopicSpecialties - DELETED

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
                b.HasOne(x => x.CatalogTopic).WithMany().HasForeignKey(x => x.CatalogTopicCode).HasPrincipalKey(x => x.CatalogTopicCode).IsRequired(false);
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

            // LecturerTags
            modelBuilder.Entity<LecturerTag>(b =>
            {
                b.HasKey(x => x.LecturerTagID);
                // Use the explicit navigation collection on LecturerProfile to avoid EF creating a shadow FK (LecturerProfileID1)
                b.HasOne(x => x.LecturerProfile).WithMany(lp => lp.LecturerTags).HasForeignKey(x => x.LecturerProfileID).OnDelete(DeleteBehavior.Cascade);
                // Map Tag relationship explicitly to Tag.LecturerTags to avoid shadow FK creation
                b.HasOne(x => x.Tag).WithMany(t => t.LecturerTags).HasForeignKey(x => x.TagID).OnDelete(DeleteBehavior.Cascade);
                b.HasOne(x => x.AssignedByUser).WithMany().HasForeignKey(x => x.AssignedByUserCode).HasPrincipalKey(x => x.UserCode).OnDelete(DeleteBehavior.SetNull);

                b.Property(x => x.LecturerCode).HasMaxLength(40);
                b.Property(x => x.TagCode).HasMaxLength(40);
                b.Property(x => x.AssignedByUserCode).HasMaxLength(40);
                b.Property(x => x.AssignedAt).HasDefaultValueSql("SYSUTCDATETIME()");

                // Unique constraint: one lecturer can only have one assignment of the same tag
                b.HasIndex(x => new { x.LecturerProfileID, x.TagID }).IsUnique();
            });

            // SystemActivityLog
            modelBuilder.Entity<SystemActivityLog>(b =>
            {
                b.ToTable("SystemActivityLogs");
                b.HasKey(x => x.LogID);
                b.Property(x => x.EntityName).HasMaxLength(100);
                b.Property(x => x.EntityID).HasMaxLength(60);
                b.Property(x => x.ActionType).HasMaxLength(30).IsRequired();
                b.Property(x => x.UserCode).HasMaxLength(40);
                b.Property(x => x.UserRole).HasMaxLength(30);
                b.Property(x => x.IPAddress).HasMaxLength(45);
                b.Property(x => x.DeviceInfo).HasMaxLength(255);
                b.Property(x => x.Module).HasMaxLength(100);
                b.Property(x => x.Status).HasMaxLength(30);
                b.Property(x => x.RelatedRecordCode).HasMaxLength(60);
                b.Property(x => x.PerformedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                
                // Optional foreign key to User
                b.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserID)
                    .OnDelete(DeleteBehavior.SetNull);

                // Indexes for performance
                b.HasIndex(x => x.EntityName);
                b.HasIndex(x => x.ActionType);
                b.HasIndex(x => x.UserCode);
                b.HasIndex(x => x.PerformedAt);
                b.HasIndex(x => x.Module);
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

        /// <summary>
        /// Override SaveChangesAsync để tự động ghi log các thao tác INSERT/UPDATE/DELETE
        /// </summary>
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var logs = new List<SystemActivityLog>();

            // Lấy thông tin người dùng hiện tại
            var userId = _currentUserService?.GetUserId();
            var userCode = _currentUserService?.GetUserCode();
            var userRole = _currentUserService?.GetUserRole();
            var ipAddress = _currentUserService?.GetIpAddress();
            var deviceInfo = _currentUserService?.GetDeviceInfo();

            // Lấy các entity đã thay đổi trước khi save
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added || 
                           e.State == EntityState.Modified || 
                           e.State == EntityState.Deleted)
                .Where(e => e.Entity.GetType() != typeof(SystemActivityLog)) // Không log chính bảng log
                .ToList();

            foreach (var entry in entries)
            {
                var entityName = entry.Entity.GetType().Name;
                var entityId = GetEntityId(entry);
                var module = GetModuleFromEntity(entityName);

                SystemActivityLog? log = null;

                switch (entry.State)
                {
                    case EntityState.Added:
                        // LOG INSERT - Ghi lại dữ liệu mới được tạo
                        log = new SystemActivityLog
                        {
                            EntityName = entityName,
                            EntityID = entityId,
                            ActionType = "CREATE",
                            ActionDescription = $"Tạo mới {GetFriendlyEntityName(entityName)}",
                            OldValue = null, // Không có dữ liệu cũ
                            NewValue = SerializeEntity(entry.CurrentValues.ToObject()), // Dữ liệu mới
                            Module = module,
                            Status = "PENDING" // Sẽ update thành SUCCESS sau khi save thành công
                        };
                        break;

                    case EntityState.Modified:
                        // LOG UPDATE - Ghi lại dữ liệu cũ và mới
                        var modifiedProperties = entry.Properties
                            .Where(p => p.IsModified)
                            .Select(p => p.Metadata.Name)
                            .ToList();

                        if (modifiedProperties.Any())
                        {
                            var oldValues = new Dictionary<string, object?>();
                            var newValues = new Dictionary<string, object?>();

                            foreach (var propName in modifiedProperties)
                            {
                                oldValues[propName] = entry.OriginalValues[propName];
                                newValues[propName] = entry.CurrentValues[propName];
                            }

                            log = new SystemActivityLog
                            {
                                EntityName = entityName,
                                EntityID = entityId,
                                ActionType = "UPDATE",
                                ActionDescription = $"Cập nhật {GetFriendlyEntityName(entityName)} - Thay đổi: {string.Join(", ", modifiedProperties)}",
                                OldValue = JsonSerializer.Serialize(oldValues), // Dữ liệu cũ
                                NewValue = JsonSerializer.Serialize(newValues), // Dữ liệu mới
                                Module = module,
                                Status = "PENDING"
                            };
                        }
                        break;

                    case EntityState.Deleted:
                        // LOG DELETE - Ghi lại dữ liệu trước khi xóa
                        log = new SystemActivityLog
                        {
                            EntityName = entityName,
                            EntityID = entityId,
                            ActionType = "DELETE",
                            ActionDescription = $"Xóa {GetFriendlyEntityName(entityName)}",
                            OldValue = SerializeEntity(entry.OriginalValues.ToObject()), // Dữ liệu bị xóa
                            NewValue = null, // Không còn dữ liệu
                            Module = module,
                            Status = "PENDING"
                        };
                        break;
                }

                if (log != null)
                {
                    // Gắn thông tin người dùng
                    log.UserID = userId;
                    log.UserCode = userCode ?? "SYSTEM";
                    log.UserRole = userRole ?? "System";
                    log.IPAddress = ipAddress;
                    log.DeviceInfo = deviceInfo;
                    log.PerformedAt = DateTime.UtcNow;

                    logs.Add(log);
                }
            }

            // Thực hiện save changes
            int result;
            try
            {
                result = await base.SaveChangesAsync(cancellationToken);

                // Cập nhật status thành SUCCESS cho tất cả logs
                foreach (var log in logs)
                {
                    log.Status = "SUCCESS";
                }
            }
            catch (Exception ex)
            {
                // Cập nhật status thành FAILED nếu có lỗi
                foreach (var log in logs)
                {
                    log.Status = "FAILED";
                    log.Comment = $"Error: {ex.Message}";
                }
                
                // Re-throw exception sau khi đã log
                throw;
            }
            finally
            {
                // Thêm logs vào database (nếu có)
                if (logs.Any())
                {
                    await SystemActivityLogs.AddRangeAsync(logs, cancellationToken);
                    await base.SaveChangesAsync(cancellationToken);
                }
            }

            return result;
        }

        /// <summary>
        /// Lấy ID hoặc Code của entity để ghi log
        /// </summary>
        private string? GetEntityId(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
        {
            var entity = entry.Entity;
            var type = entity.GetType();

            // Ưu tiên lấy các trường Code
            var codeProperty = type.GetProperty("TopicCode") ?? 
                             type.GetProperty("StudentCode") ?? 
                             type.GetProperty("LecturerCode") ??
                             type.GetProperty("UserCode") ??
                             type.GetProperty("DepartmentCode") ??
                             type.GetProperty("MilestoneCode") ??
                             type.GetProperty("SubmissionCode") ??
                             type.GetProperty("CommitteeCode") ??
                             type.GetProperty("TagCode");

            if (codeProperty != null)
            {
                return codeProperty.GetValue(entity)?.ToString();
            }

            // Fallback về ID
            var idProperty = type.GetProperty("TopicID") ?? 
                           type.GetProperty("StudentProfileID") ?? 
                           type.GetProperty("LecturerProfileID") ??
                           type.GetProperty("UserID") ??
                           type.GetProperty("DepartmentID") ??
                           type.GetProperty("MilestoneID") ??
                           type.GetProperty("SubmissionID") ??
                           type.GetProperty("CommitteeID");

            return idProperty?.GetValue(entity)?.ToString();
        }

        /// <summary>
        /// Chuyển entity thành JSON string (loại bỏ navigation properties để tránh circular reference)
        /// </summary>
        private string? SerializeEntity(object? entity)
        {
            if (entity == null) return null;

            try
            {
                var options = new JsonSerializerOptions
                {
                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
                    WriteIndented = false,
                    MaxDepth = 3 // Giới hạn độ sâu để tránh circular reference
                };
                return JsonSerializer.Serialize(entity, options);
            }
            catch
            {
                return entity.ToString();
            }
        }

        /// <summary>
        /// Xác định module dựa trên tên entity
        /// </summary>
        private string GetModuleFromEntity(string entityName)
        {
            return entityName switch
            {
                "User" or "StudentProfile" or "LecturerProfile" => "User",
                "Topic" or "CatalogTopic" or "TopicLecturer" or "TopicTag" => "Topic",
                "ProgressMilestone" or "ProgressSubmission" or "MilestoneTemplate" => "Milestone",
                "Committee" or "CommitteeMember" or "CommitteeSession" or "CommitteeTag" => "Committee",
                "DefenseAssignment" or "DefenseScore" => "Defense",
                "SubmissionFile" => "Submission",
                "Department" => "Department",
                "Tag" or "CatalogTopicTag" or "LecturerTag" => "Catalog",
                _ => "System"
            };
        }

        /// <summary>
        /// Chuyển tên entity sang tiếng Việt để dễ đọc
        /// </summary>
        private string GetFriendlyEntityName(string entityName)
        {
            return entityName switch
            {
                "User" => "người dùng",
                "StudentProfile" => "hồ sơ sinh viên",
                "LecturerProfile" => "hồ sơ giảng viên",
                "Topic" => "đề tài",
                "CatalogTopic" => "danh mục đề tài",
                "ProgressMilestone" => "tiến độ",
                "ProgressSubmission" => "bài nộp",
                "Committee" => "hội đồng",
                "CommitteeMember" => "thành viên hội đồng",
                "DefenseAssignment" => "phân công bảo vệ",
                "DefenseScore" => "điểm bảo vệ",
                "Department" => "khoa",
                "Tag" => "tag",
                _ => entityName.ToLower()
            };
        }
    }
}
