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
        public DbSet<Class> Classes => Set<Class>();
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
        public DbSet<DefenseTerm> DefenseTerms => Set<DefenseTerm>();
        public DbSet<SyncAuditLog> SyncAuditLogs => Set<SyncAuditLog>();
        public DbSet<LecturerBusyTime> LecturerBusyTimes => Set<LecturerBusyTime>();
        public DbSet<DefenseGroup> DefenseGroups => Set<DefenseGroup>();
        public DbSet<ExportFile> ExportFiles => Set<ExportFile>();
        public DbSet<EvaluationReview> EvaluationReviews => Set<EvaluationReview>();
        public DbSet<DefenseMinute> DefenseMinutes => Set<DefenseMinute>();
        public DbSet<DefenseResult> DefenseResults => Set<DefenseResult>();
        public DbSet<DefenseRevision> DefenseRevisions => Set<DefenseRevision>();
        public DbSet<DefenseDocument> DefenseDocuments => Set<DefenseDocument>();
        public DbSet<CommitteeTag> CommitteeTags => Set<CommitteeTag>();
        
        public DbSet<TopicLecturer> TopicLecturers => Set<TopicLecturer>();
        
        // New DbSets for Tag system
        public DbSet<Tag> Tags => Set<Tag>();
        public DbSet<CatalogTopicTag> CatalogTopicTags => Set<CatalogTopicTag>();
        public DbSet<TopicTag> TopicTags => Set<TopicTag>();
        public DbSet<LecturerTag> LecturerTags => Set<LecturerTag>();
        public DbSet<MilestoneTemplate> MilestoneTemplates => Set<MilestoneTemplate>();
        public DbSet<SubmissionFile> SubmissionFiles => Set<SubmissionFile>();
        public DbSet<Conversation> Conversations => Set<Conversation>();
        public DbSet<ConversationMember> ConversationMembers => Set<ConversationMember>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<MessageAttachment> MessageAttachments => Set<MessageAttachment>();
        public DbSet<MessageReaction> MessageReactions => Set<MessageReaction>();
        public DbSet<MessageReadReceipt> MessageReadReceipts => Set<MessageReadReceipt>();
        public DbSet<TopicWorkflowAudit> TopicWorkflowAudits => Set<TopicWorkflowAudit>();
        
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
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // Users
            modelBuilder.Entity<User>(b =>
            {
                b.HasKey(x => x.UserID);
                b.Property(x => x.UserCode).HasMaxLength(40).IsRequired();
                b.HasIndex(x => x.UserCode).IsUnique();
                b.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
                b.Property(x => x.Role).HasMaxLength(20).IsRequired();
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // StudentProfiles
            modelBuilder.Entity<StudentProfile>(b =>
            {
                b.HasKey(x => x.StudentProfileID);
                b.Property(x => x.StudentCode).HasMaxLength(30).IsRequired();
                b.HasIndex(x => x.StudentCode).IsUnique();
                b.HasOne(x => x.User).WithOne(x => x.StudentProfile).HasForeignKey<StudentProfile>(x => x.UserID);
                b.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentID).OnDelete(DeleteBehavior.SetNull);
                b.HasOne(x => x.Class).WithMany(x => x.StudentProfiles).HasForeignKey(x => x.ClassID).OnDelete(DeleteBehavior.SetNull);
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

                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // Classes
            modelBuilder.Entity<Class>(b =>
            {
                b.ToTable("CLASSES");
                b.HasKey(x => x.ClassID);
                b.Property(x => x.ClassCode).HasMaxLength(30).IsRequired();
                b.HasIndex(x => x.ClassCode).IsUnique();
                b.Property(x => x.ClassName).HasMaxLength(150).IsRequired();
                b.Property(x => x.DepartmentCode).HasMaxLength(30);
                b.Property(x => x.Status).HasMaxLength(30).HasDefaultValue("Đang hoạt động");
                b.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentID).OnDelete(DeleteBehavior.Restrict);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
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
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
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
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // Topics
            modelBuilder.Entity<Topic>(b =>
            {
                b.ToTable("TOPICS", tb =>
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
                // Oracle: map to CLOB by convention
                b.Property(x => x.LecturerComment);
                
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
                
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
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // ProgressSubmissions
            modelBuilder.Entity<ProgressSubmission>(b =>
            {
                // Inform EF Core that triggers exist on this table so it avoids using a bare OUTPUT clause.
                // Update the trigger names below to match the actual triggers defined in the database.
                b.ToTable("PROGRESSSUBMISSIONS", tb =>
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
                b.Property(x => x.SubmittedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.AttemptNumber).HasDefaultValue(1);
                // File columns are stored in SubmissionFiles table; do not configure file columns on ProgressSubmission
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
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
                b.Property(x => x.Deadline);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
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
                b.Property(x => x.UploadedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.UploadedByUserCode).HasMaxLength(40);
            });

            // Conversations
            modelBuilder.Entity<Conversation>(b =>
            {
                b.ToTable("CONVERSATIONS");
                b.HasKey(x => x.ConversationID);
                b.Property(x => x.ConversationCode).HasMaxLength(50).IsRequired();
                b.HasIndex(x => x.ConversationCode).IsUnique();
                b.Property(x => x.ConversationType).HasMaxLength(20).IsRequired();
                b.Property(x => x.Title).HasMaxLength(200);
                b.Property(x => x.CreatedByUserCode).HasMaxLength(40);
                b.Property(x => x.AvatarURL).HasMaxLength(500);
                b.Property(x => x.LastMessagePreview).HasMaxLength(500);
                b.Property(x => x.IsArchived).HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated);
                b.HasOne<User>().WithMany().HasForeignKey(x => x.CreatedByUserID).OnDelete(DeleteBehavior.Restrict);
            });

            // ConversationMembers
            modelBuilder.Entity<ConversationMember>(b =>
            {
                b.ToTable("CONVERSATIONMEMBERS");
                b.HasKey(x => x.MemberID);
                b.Property(x => x.ConversationCode).HasMaxLength(50);
                b.Property(x => x.UserCode).HasMaxLength(40);
                b.Property(x => x.MemberRole).HasMaxLength(20).HasDefaultValue("Member");
                b.Property(x => x.NickName).HasMaxLength(100);
                b.Property(x => x.UserCode).HasMaxLength(40).IsRequired();
                b.Property(x => x.IsMuted).HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.IsPinned).HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.UnreadCount).HasDefaultValue(0);
                b.Property(x => x.JoinedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.HasOne(x => x.Conversation).WithMany(x => x.Members).HasForeignKey(x => x.ConversationID).OnDelete(DeleteBehavior.Cascade);
                b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserID).OnDelete(DeleteBehavior.Cascade);
                b.HasIndex(x => new { x.ConversationID, x.UserCode }).IsUnique();
            });

            // Messages
            modelBuilder.Entity<Message>(b =>
            {
                b.ToTable("MESSAGES");
                b.HasKey(x => x.MessageID);
                b.Property(x => x.MessageCode).HasMaxLength(60).IsRequired();
                b.HasIndex(x => x.MessageCode).IsUnique();
                b.Property(x => x.ConversationCode).HasMaxLength(50);
                b.Property(x => x.SenderUserID).IsRequired();
                b.Property(x => x.SenderUserCode).HasMaxLength(40).IsRequired();
                b.Property(x => x.MessageType).HasMaxLength(20).HasDefaultValue("TEXT");
                b.Property(x => x.IsEdited).HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.IsDeleted).HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.DeletedForEveryone).HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.SentAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.HasOne(x => x.Conversation).WithMany(x => x.Messages).HasForeignKey(x => x.ConversationID).OnDelete(DeleteBehavior.Cascade);
                b.HasOne(x => x.SenderUser).WithMany().HasForeignKey(x => x.SenderUserID).OnDelete(DeleteBehavior.Restrict);
                b.HasOne(x => x.ReplyToMessage).WithMany().HasForeignKey(x => x.ReplyToMessageID).OnDelete(DeleteBehavior.SetNull);
                b.HasIndex(x => new { x.ConversationID, x.SentAt });
            });

            // MessageAttachments
            modelBuilder.Entity<MessageAttachment>(b =>
            {
                b.ToTable("MESSAGEATTACHMENTS");
                b.HasKey(x => x.AttachmentID);
                b.Property(x => x.FileUrl).HasMaxLength(1024).IsRequired();
                b.Property(x => x.FileName).HasMaxLength(255);
                b.Property(x => x.MimeType).HasMaxLength(100);
                b.Property(x => x.ThumbnailURL).HasMaxLength(1000);
                b.Property(x => x.UploadedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.HasOne(x => x.Message).WithMany(x => x.Attachments).HasForeignKey(x => x.MessageID).OnDelete(DeleteBehavior.Cascade);
            });

            // MessageReactions
            modelBuilder.Entity<MessageReaction>(b =>
            {
                b.ToTable("MESSAGEREACTIONS");
                b.HasKey(x => x.ReactionID);
                b.Property(x => x.UserID).IsRequired();
                b.Property(x => x.UserCode).HasMaxLength(40).IsRequired();
                b.Property(x => x.ReactionType).HasMaxLength(20);
                b.Property(x => x.ReactedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.HasOne(x => x.Message).WithMany(x => x.Reactions).HasForeignKey(x => x.MessageID).OnDelete(DeleteBehavior.Cascade);
                b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserID).OnDelete(DeleteBehavior.Cascade);
                b.HasIndex(x => new { x.MessageID, x.UserCode, x.ReactionType }).IsUnique();
            });

            // MessageReadReceipts
            modelBuilder.Entity<MessageReadReceipt>(b =>
            {
                b.ToTable("MESSAGEREADRECEIPTS");
                b.HasKey(x => x.ReceiptID);
                b.Property(x => x.UserID).IsRequired();
                b.Property(x => x.UserCode).HasMaxLength(40).IsRequired();
                b.Property(x => x.ReadAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.HasOne(x => x.Message).WithMany().HasForeignKey(x => x.MessageID).OnDelete(DeleteBehavior.Cascade);
                b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserID).OnDelete(DeleteBehavior.Cascade);
                b.HasIndex(x => new { x.MessageID, x.UserCode }).IsUnique();
            });

            // Committees
            modelBuilder.Entity<Committee>(b =>
            {
                b.ToTable("COMMITTEES", tb =>
                {
                    tb.HasTrigger("TR_Committees_Insert");
                    tb.HasTrigger("TR_Committees_Update");
                    tb.HasTrigger("TR_Committees_Delete");
                });
                b.HasKey(x => x.CommitteeID);
                b.Property(x => x.CommitteeCode).HasMaxLength(40).IsRequired();
                b.HasIndex(x => x.CommitteeCode).IsUnique();
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
            });

            modelBuilder.Entity<CommitteeSession>(b =>
            {
                b.ToTable("COMMITTEESESSIONS");
                b.HasKey(x => x.CommitteeSessionID);
                b.Property(x => x.CommitteeCode).HasMaxLength(40).IsRequired();
                b.Property(x => x.SessionNumber).IsRequired();
                b.Property(x => x.TopicCount).HasDefaultValue(0);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
                b.HasOne(x => x.Committee)
                    .WithMany()
                    .HasForeignKey(x => x.CommitteeCode)
                    .HasPrincipalKey(x => x.CommitteeCode)
                    .OnDelete(DeleteBehavior.Cascade);
                b.HasIndex(x => new { x.CommitteeCode, x.SessionNumber }).IsUnique();
            });

            modelBuilder.Entity<CommitteeTag>(b =>
            {
                b.ToTable("COMMITTEETAGS", tb =>
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
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");

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
                b.ToTable("COMMITTEEMEMBERS", tb =>
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
                b.ToTable("DEFENSEASSIGNMENTS", tb =>
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
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.Session)
                    .HasConversion(sessionConverter)
                    .HasMaxLength(20);
                b.Property(x => x.Shift)
                    .HasConversion<string>()
                    .HasMaxLength(20);
                b.Property(x => x.OrderIndex);
                // Oracle provider maps TimeSpan to INTERVAL DAY TO SECOND
                b.Property(x => x.StartTime);
                b.Property(x => x.EndTime);
                b.Property(x => x.AssignedBy).HasMaxLength(40);
                b.Property(x => x.AssignedAt);
                b.Property(x => x.Status).HasMaxLength(30);
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
                b.Property(x => x.Role).HasMaxLength(20);
                b.Property(x => x.Score).HasColumnType("NUMBER(4,2)");
                b.Property(x => x.IsSubmitted).HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // DefenseTerms
            modelBuilder.Entity<DefenseTerm>(b =>
            {
                b.ToTable("DEFENSETERMS");
                b.HasKey(x => x.DefenseTermId);
                b.Property(x => x.Name).HasMaxLength(200).IsRequired();
                b.Property(x => x.StartDate);
                b.Property(x => x.ConfigJson);
                b.Property(x => x.Status).HasMaxLength(30).HasDefaultValue("Draft");
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // SyncAuditLogs
            modelBuilder.Entity<SyncAuditLog>(b =>
            {
                b.ToTable("SYNCAUDITLOGS");
                b.HasKey(x => x.SyncAuditLogId);
                b.Property(x => x.Action).HasMaxLength(150).IsRequired();
                b.Property(x => x.Result).HasMaxLength(50).IsRequired();
                b.Property(x => x.Records).HasMaxLength(50).IsRequired();
                b.Property(x => x.Timestamp).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // LecturerBusyTimes
            modelBuilder.Entity<LecturerBusyTime>(b =>
            {
                b.ToTable("LECTURERBUSYTIMES");
                b.HasKey(x => x.LecturerBusyTimeId);
                b.Property(x => x.Slot).HasMaxLength(20).IsRequired();
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.HasOne(x => x.LecturerProfile)
                    .WithMany()
                    .HasForeignKey(x => x.LecturerProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                b.HasIndex(x => new { x.LecturerProfileId, x.Slot }).IsUnique();
            });

            // DefenseGroups
            modelBuilder.Entity<DefenseGroup>(b =>
            {
                b.ToTable("DEFENSEGROUPS");
                b.HasKey(x => x.DefenseGroupId);
                b.Property(x => x.TermId).IsRequired();
                b.Property(x => x.SlotId).HasMaxLength(80).IsRequired();
                b.Property(x => x.StudentCodesJson).IsRequired();
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
                b.HasIndex(x => new { x.TermId, x.SlotId });
            });

            // ExportFiles
            modelBuilder.Entity<ExportFile>(b =>
            {
                b.ToTable("EXPORTFILES");
                b.HasKey(x => x.ExportFileId);
                b.Property(x => x.FileCode).HasMaxLength(40).IsRequired();
                b.HasIndex(x => x.FileCode).IsUnique();
                b.Property(x => x.Status).HasMaxLength(30).HasDefaultValue("Running");
                b.Property(x => x.FileUrl).HasMaxLength(500);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // EvaluationReviews
            modelBuilder.Entity<EvaluationReview>(b =>
            {
                b.ToTable("EVALUATION_REVIEWS");
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).HasColumnName("REVIEWID");
                b.Property(x => x.AssignmentId).HasColumnName("ASSIGNMENTID");
                b.Property(x => x.LecturerId).HasColumnName("LECTURERPROFILEID");
                b.Property(x => x.ReviewType)
                    .HasColumnName("REVIEWTYPE")
                    .HasConversion<string>()
                    .HasMaxLength(20)
                    .IsRequired();
                b.Property(x => x.Criteria1Text).HasColumnName("CRITERIA_1_TEXT");
                b.Property(x => x.Criteria2Text).HasColumnName("CRITERIA_2_TEXT");
                b.Property(x => x.Criteria3Text).HasColumnName("CRITERIA_3_TEXT");
                b.Property(x => x.Criteria4Text).HasColumnName("CRITERIA_4_TEXT");
                b.Property(x => x.Limitations).HasColumnName("LIMITATIONS");
                b.Property(x => x.Suggestions).HasColumnName("SUGGESTIONS");
                b.Property(x => x.NumericScore).HasColumnName("NUMERICSCORE").HasColumnType("NUMBER(5,2)");
                b.Property(x => x.TextScore).HasColumnName("TEXTSCORE").HasMaxLength(100);
                b.Property(x => x.IsApproved).HasColumnName("IS_APPROVED").HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.CreatedAt).HasColumnName("CREATEDAT").HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasColumnName("LASTUPDATED").HasDefaultValueSql("SYSTIMESTAMP");
                b.HasOne(x => x.Assignment).WithMany().HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
                b.HasOne(x => x.Lecturer).WithMany().HasForeignKey(x => x.LecturerId).OnDelete(DeleteBehavior.Restrict);
            });

            // DefenseMinutes
            modelBuilder.Entity<DefenseMinute>(b =>
            {
                b.ToTable("DEFENSE_MINUTES");
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).HasColumnName("MINUTEID");
                b.Property(x => x.AssignmentId).HasColumnName("ASSIGNMENTID");
                b.Property(x => x.SecretaryId).HasColumnName("SECRETARY_ID");
                b.Property(x => x.SummaryContent).HasColumnName("SUMMARYCONTENT");
                b.Property(x => x.ReviewerComments).HasColumnName("REVIEWERCOMMENTS");
                b.Property(x => x.QnaDetails).HasColumnName("QNA_DETAILS");
                b.Property(x => x.Strengths).HasColumnName("STRENGTHS");
                b.Property(x => x.Weaknesses).HasColumnName("WEAKNESSES");
                b.Property(x => x.Recommendations).HasColumnName("RECOMMENDATIONS");
                b.Property(x => x.CreatedAt).HasColumnName("CREATEDAT").HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasColumnName("LASTUPDATED").HasDefaultValueSql("SYSTIMESTAMP");
                b.HasIndex(x => x.AssignmentId).IsUnique();
                b.HasOne(x => x.Assignment).WithMany().HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
                b.HasOne(x => x.Secretary).WithMany().HasForeignKey(x => x.SecretaryId).OnDelete(DeleteBehavior.Restrict);
            });

            // DefenseResults
            modelBuilder.Entity<DefenseResult>(b =>
            {
                b.ToTable("DEFENSE_RESULTS");
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).HasColumnName("RESULTID");
                b.Property(x => x.AssignmentId).HasColumnName("ASSIGNMENTID");
                b.Property(x => x.ScoreGvhd).HasColumnName("SCORE_GVHD").HasColumnType("NUMBER(5,2)");
                b.Property(x => x.ScoreCt).HasColumnName("SCORE_CT").HasColumnType("NUMBER(5,2)");
                b.Property(x => x.ScoreUvtk).HasColumnName("SCORE_UVTK").HasColumnType("NUMBER(5,2)");
                b.Property(x => x.ScoreUvpb).HasColumnName("SCORE_UVPB").HasColumnType("NUMBER(5,2)");
                b.Property(x => x.FinalScoreNumeric).HasColumnName("FINALSCORE_NUMERIC").HasColumnType("NUMBER(5,2)");
                b.Property(x => x.FinalScoreText).HasColumnName("FINALSCORE_TEXT").HasMaxLength(100);
                b.Property(x => x.IsLocked).HasColumnName("ISLOCKED").HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.CreatedAt).HasColumnName("CREATEDAT").HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasColumnName("LASTUPDATED").HasDefaultValueSql("SYSTIMESTAMP");
                b.HasIndex(x => x.AssignmentId).IsUnique();
                b.HasOne(x => x.Assignment).WithMany().HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
            });

            // DefenseRevisions
            modelBuilder.Entity<DefenseRevision>(b =>
            {
                b.ToTable("DEFENSE_REVISIONS");
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).HasColumnName("REVISIONID");
                b.Property(x => x.AssignmentId).HasColumnName("ASSIGNMENTID");
                b.Property(x => x.RevisedContent).HasColumnName("REVISEDCONTENT");
                b.Property(x => x.RevisionFileUrl).HasColumnName("REVISIONFILEURL").HasMaxLength(500);
                b.Property(x => x.IsGvhdApproved).HasColumnName("IS_GVHD_APPROVED").HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.IsUvtkApproved).HasColumnName("IS_UVTK_APPROVED").HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.IsCtApproved).HasColumnName("IS_CT_APPROVED").HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.FinalStatus)
                    .HasColumnName("FINALSTATUS")
                    .HasConversion<string>()
                    .HasMaxLength(50)
                    .HasDefaultValue(RevisionFinalStatus.Pending);
                b.Property(x => x.CreatedAt).HasColumnName("CREATEDAT").HasDefaultValueSql("SYSTIMESTAMP");
                b.Property(x => x.LastUpdated).HasColumnName("LASTUPDATED").HasDefaultValueSql("SYSTIMESTAMP");
                b.HasIndex(x => x.AssignmentId).IsUnique();
                b.HasOne(x => x.Assignment).WithMany().HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
            });

            // DefenseDocuments
            modelBuilder.Entity<DefenseDocument>(b =>
            {
                b.ToTable("DEFENSE_DOCUMENTS");
                b.HasKey(x => x.DocumentId);
                b.Property(x => x.DocumentId).HasColumnName("DOCUMENTID");
                b.Property(x => x.AssignmentId).HasColumnName("ASSIGNMENTID");
                b.Property(x => x.DocumentType).HasColumnName("DOCUMENTTYPE").HasMaxLength(50).IsRequired();
                b.Property(x => x.FileUrl).HasColumnName("FILEURL").HasMaxLength(500).IsRequired();
                b.Property(x => x.GeneratedAt).HasColumnName("GENERATEDAT").HasDefaultValueSql("SYSTIMESTAMP");
                b.HasOne(x => x.Assignment).WithMany().HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
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
                b.Property(x => x.IsPrimary).HasConversion<int>().HasDefaultValue(0);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // Tags
            modelBuilder.Entity<Tag>(b =>
            {
                b.HasKey(x => x.TagID);
                b.Property(x => x.TagCode).HasMaxLength(40).IsRequired();
                b.HasIndex(x => x.TagCode).IsUnique();
                b.Property(x => x.TagName).HasMaxLength(100).IsRequired();
                b.Property(x => x.Description).HasMaxLength(500);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
            });

            // CatalogTopicTags (Many-to-Many)
            modelBuilder.Entity<CatalogTopicTag>(b =>
            {
                b.HasKey(x => new { x.CatalogTopicID, x.TagID });
                b.HasOne(x => x.CatalogTopic).WithMany(x => x.CatalogTopicTags).HasForeignKey(x => x.CatalogTopicID);
                b.HasOne(x => x.Tag).WithMany(x => x.CatalogTopicTags).HasForeignKey(x => x.TagID);
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
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
                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSTIMESTAMP");
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
                b.Property(x => x.AssignedAt).HasDefaultValueSql("SYSTIMESTAMP");

                // Unique constraint: one lecturer can only have one assignment of the same tag
                b.HasIndex(x => new { x.LecturerProfileID, x.TagID }).IsUnique();
            });

            // SystemActivityLog
            modelBuilder.Entity<SystemActivityLog>(b =>
            {
                b.ToTable("SYSTEMACTIVITYLOGS");
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
                b.Property(x => x.PerformedAt).HasDefaultValueSql("SYSTIMESTAMP");
                
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

            // TopicWorkflowAudit
            modelBuilder.Entity<TopicWorkflowAudit>(b =>
            {
                b.ToTable("TOPIC_WORKFLOW_AUDITS");
                b.HasKey(x => x.AuditID);

                b.Property(x => x.AuditID).HasColumnName("AUDIT_ID");
                b.Property(x => x.AuditCode).HasColumnName("AUDIT_CODE").HasMaxLength(50).IsRequired();
                b.HasIndex(x => x.AuditCode).IsUnique();

                b.Property(x => x.ModuleName).HasColumnName("MODULE_NAME").HasMaxLength(50).IsRequired();
                b.Property(x => x.WorkflowName).HasColumnName("WORKFLOW_NAME").HasMaxLength(100).IsRequired();
                b.Property(x => x.ActionType).HasColumnName("ACTION_TYPE").HasMaxLength(30).IsRequired();
                b.Property(x => x.DecisionAction).HasColumnName("DECISION_ACTION").HasMaxLength(30);

                b.Property(x => x.TopicID).HasColumnName("TOPIC_ID");
                b.Property(x => x.TopicCode).HasColumnName("TOPIC_CODE").HasMaxLength(60);
                b.Property(x => x.EntityName).HasColumnName("ENTITY_NAME").HasMaxLength(100);
                b.Property(x => x.EntityID).HasColumnName("ENTITY_ID").HasMaxLength(60);
                b.Property(x => x.EntityCode).HasColumnName("ENTITY_CODE").HasMaxLength(60);

                b.Property(x => x.OldStatus).HasColumnName("OLD_STATUS").HasMaxLength(50);
                b.Property(x => x.NewStatus).HasColumnName("NEW_STATUS").HasMaxLength(50);
                b.Property(x => x.StatusCode).HasColumnName("STATUS_CODE").HasMaxLength(30);

                b.Property(x => x.ResubmitCountBefore).HasColumnName("RESUBMIT_COUNT_BEFORE");
                b.Property(x => x.ResubmitCountAfter).HasColumnName("RESUBMIT_COUNT_AFTER");

                b.Property(x => x.CommentText).HasColumnName("COMMENT_TEXT");
                b.Property(x => x.ErrorMessage).HasColumnName("ERROR_MESSAGE");
                b.Property(x => x.IsSuccess).HasColumnName("IS_SUCCESS").HasDefaultValue(1).IsRequired();

                b.Property(x => x.RequestPayload).HasColumnName("REQUEST_PAYLOAD");
                b.Property(x => x.ResponsePayload).HasColumnName("RESPONSE_PAYLOAD");

                b.Property(x => x.ChangedFields).HasColumnName("CHANGED_FIELDS");
                b.Property(x => x.TagsBefore).HasColumnName("TAGS_BEFORE");
                b.Property(x => x.TagsAfter).HasColumnName("TAGS_AFTER");
                b.Property(x => x.MilestoneBefore).HasColumnName("MILESTONE_BEFORE");
                b.Property(x => x.MilestoneAfter).HasColumnName("MILESTONE_AFTER");

                b.Property(x => x.ActorUserID).HasColumnName("ACTOR_USER_ID");
                b.Property(x => x.ActorUserCode).HasColumnName("ACTOR_USER_CODE").HasMaxLength(60);
                b.Property(x => x.ActorRole).HasColumnName("ACTOR_ROLE").HasMaxLength(40);
                b.Property(x => x.ReviewerUserID).HasColumnName("REVIEWER_USER_ID");
                b.Property(x => x.ReviewerUserCode).HasColumnName("REVIEWER_USER_CODE").HasMaxLength(60);

                b.Property(x => x.CorrelationID).HasColumnName("CORRELATION_ID").HasMaxLength(100);
                b.Property(x => x.IdempotencyKey).HasColumnName("IDEMPOTENCY_KEY").HasMaxLength(100);
                b.Property(x => x.RequestID).HasColumnName("REQUEST_ID").HasMaxLength(100);

                b.Property(x => x.IPAddress).HasColumnName("IP_ADDRESS").HasMaxLength(64);
                b.Property(x => x.UserAgent).HasColumnName("USER_AGENT").HasMaxLength(500);
                b.Property(x => x.DeviceInfo).HasColumnName("DEVICE_INFO").HasMaxLength(500);
                b.Property(x => x.CreatedAt).HasColumnName("CREATED_AT").HasDefaultValueSql("SYSTIMESTAMP");

                b.HasIndex(x => x.TopicID);
                b.HasIndex(x => x.TopicCode);
                b.HasIndex(x => x.ActionType);
                b.HasIndex(x => x.StatusCode);
                b.HasIndex(x => x.ActorUserCode);
                b.HasIndex(x => x.CreatedAt);
                b.HasIndex(x => x.CorrelationID);
            });

            ApplyOracleIdentifierNamingRules(modelBuilder);
        }

        private static void ApplyOracleIdentifierNamingRules(ModelBuilder modelBuilder)
        {
            var preserveExplicitMappingTables = new HashSet<string>(StringComparer.Ordinal)
            {
                "EVALUATION_REVIEWS",
                "DEFENSE_MINUTES",
                "DEFENSE_RESULTS",
                "DEFENSE_REVISIONS",
                "DEFENSE_DOCUMENTS"
            };

            var keepPascalCaseColumns = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal)
            {
                ["MILESTONETEMPLATES"] = new HashSet<string>(StringComparer.Ordinal) { "Ordinal" },
                ["DEFENSESCORES"] = new HashSet<string>(StringComparer.Ordinal) { "Comment" },
                ["Users"] = new HashSet<string>(StringComparer.Ordinal) { "Role" },
                ["TOPICS"] = new HashSet<string>(StringComparer.Ordinal) { "Type" },
                ["SYSTEMACTIVITYLOGS"] = new HashSet<string>(StringComparer.Ordinal) { "Comment" },
                ["PROGRESSMILESTONES"] = new HashSet<string>(StringComparer.Ordinal) { "Ordinal" }
            };

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                var tableName = entityType.GetTableName();
                if (string.IsNullOrWhiteSpace(tableName))
                {
                    continue;
                }

                var normalizedTableName = string.Equals(tableName, "Users", StringComparison.OrdinalIgnoreCase)
                    ? "Users"
                    : tableName.ToUpperInvariant();

                entityType.SetTableName(normalizedTableName);

                if (preserveExplicitMappingTables.Contains(normalizedTableName))
                // Keep explicit snake_case mappings for audit table.
                if (string.Equals(normalizedTableName, "TOPIC_WORKFLOW_AUDITS", StringComparison.Ordinal))
                {
                    continue;
                }

                foreach (var property in entityType.GetProperties())
                {
                    var keepPascalCase = keepPascalCaseColumns.TryGetValue(normalizedTableName, out var columns)
                                        && columns.Contains(property.Name);

                    property.SetColumnName(keepPascalCase ? property.Name : property.Name.ToUpperInvariant());
                }
            }
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
                             type.GetProperty("ConversationCode") ??
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
                           type.GetProperty("ConversationID") ??
                           type.GetProperty("MessageID") ??
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
                "Conversation" or "ConversationMember" or "Message" or "MessageAttachment" or "MessageReaction" or "MessageReadReceipt" => "Chat",
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
                "Conversation" => "cuộc trò chuyện",
                "ConversationMember" => "thành viên cuộc trò chuyện",
                "Message" => "tin nhắn",
                "MessageAttachment" => "tệp đính kèm tin nhắn",
                "MessageReaction" => "cảm xúc tin nhắn",
                "MessageReadReceipt" => "trạng thái đã đọc",
                "Department" => "khoa",
                "Tag" => "tag",
                _ => entityName.ToLower()
            };
        }
    }
}
