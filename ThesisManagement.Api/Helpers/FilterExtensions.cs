using System.Linq;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.DTOs;

namespace ThesisManagement.Api.Helpers
{
    public static class FilterExtensions
    {
        public static IQueryable<Department> ApplyFilter(this IQueryable<Department> query, DepartmentFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.Name.Contains(filter.Search) || 
                                        x.DepartmentCode.Contains(filter.Search) ||
                                        (x.Description != null && x.Description.Contains(filter.Search)));
            }

            if (!string.IsNullOrEmpty(filter.Name))
                query = query.Where(x => x.Name.Contains(filter.Name));

            if (!string.IsNullOrEmpty(filter.DepartmentCode))
                query = query.Where(x => x.DepartmentCode.Contains(filter.DepartmentCode));

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<User> ApplyFilter(this IQueryable<User> query, UserFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.UserCode.Contains(filter.Search) || 
                                        x.FullName.Contains(filter.Search) ||
                                        (x.Email != null && x.Email.Contains(filter.Search)));
            }

            if (!string.IsNullOrEmpty(filter.Username))
                query = query.Where(x => x.UserCode.Contains(filter.Username));

            if (!string.IsNullOrEmpty(filter.FullName))
                query = query.Where(x => x.FullName.Contains(filter.FullName));

            if (!string.IsNullOrEmpty(filter.Email))
                query = query.Where(x => x.Email != null && x.Email.Contains(filter.Email));

            if (!string.IsNullOrEmpty(filter.Role))
                query = query.Where(x => x.Role == filter.Role);

            if (!string.IsNullOrEmpty(filter.UserCode))
                query = query.Where(x => x.UserCode.Contains(filter.UserCode));

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<StudentProfile> ApplyFilter(this IQueryable<StudentProfile> query, StudentProfileFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.StudentCode.Contains(filter.Search) ||
                                        (x.ClassCode != null && x.ClassCode.Contains(filter.Search)) ||
                                        (x.FacultyCode != null && x.FacultyCode.Contains(filter.Search)));
            }

            if (!string.IsNullOrWhiteSpace(filter.UserCode))
                query = query.Where(x => x.UserCode == filter.UserCode);

            if (!string.IsNullOrWhiteSpace(filter.DepartmentCode))
                query = query.Where(x => x.DepartmentCode == filter.DepartmentCode);

            if (!string.IsNullOrEmpty(filter.StudentCode))
                query = query.Where(x => x.StudentCode.Contains(filter.StudentCode));

            if (!string.IsNullOrEmpty(filter.ClassCode))
                query = query.Where(x => x.ClassCode != null && x.ClassCode.Contains(filter.ClassCode));

            if (!string.IsNullOrEmpty(filter.FacultyCode))
                query = query.Where(x => x.FacultyCode != null && x.FacultyCode.Contains(filter.FacultyCode));

            if (filter.MinGPA.HasValue)
                query = query.Where(x => x.GPA >= filter.MinGPA.Value);

            if (filter.MaxGPA.HasValue)
                query = query.Where(x => x.GPA <= filter.MaxGPA.Value);

            if (!string.IsNullOrEmpty(filter.AcademicStanding))
                query = query.Where(x => x.AcademicStanding == filter.AcademicStanding);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<LecturerProfile> ApplyFilter(this IQueryable<LecturerProfile> query, LecturerProfileFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.LecturerCode.Contains(filter.Search) ||
                                        (x.Degree != null && x.Degree.Contains(filter.Search)));
            }

            if (!string.IsNullOrWhiteSpace(filter.UserCode))
                query = query.Where(x => x.UserCode == filter.UserCode);

            if (!string.IsNullOrWhiteSpace(filter.DepartmentCode))
                query = query.Where(x => x.DepartmentCode == filter.DepartmentCode);

            if (!string.IsNullOrEmpty(filter.LecturerCode))
                query = query.Where(x => x.LecturerCode.Contains(filter.LecturerCode));

            if (!string.IsNullOrEmpty(filter.Degree))
                query = query.Where(x => x.Degree != null && x.Degree.Contains(filter.Degree));

            if (filter.MinGuideQuota.HasValue)
                query = query.Where(x => x.GuideQuota >= filter.MinGuideQuota.Value);

            if (filter.MaxGuideQuota.HasValue)
                query = query.Where(x => x.GuideQuota <= filter.MaxGuideQuota.Value);

            if (filter.MinDefenseQuota.HasValue)
                query = query.Where(x => x.DefenseQuota >= filter.MinDefenseQuota.Value);

            if (filter.MaxDefenseQuota.HasValue)
                query = query.Where(x => x.DefenseQuota <= filter.MaxDefenseQuota.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<CatalogTopic> ApplyFilter(this IQueryable<CatalogTopic> query, CatalogTopicFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.Title.Contains(filter.Search) ||
                                        x.CatalogTopicCode.Contains(filter.Search) ||
                                        (x.Summary != null && x.Summary.Contains(filter.Search)));
            }

            if (!string.IsNullOrEmpty(filter.Title))
                query = query.Where(x => x.Title.Contains(filter.Title));

            if (!string.IsNullOrEmpty(filter.CatalogTopicCode))
                query = query.Where(x => x.CatalogTopicCode.Contains(filter.CatalogTopicCode));

            // Tags filtering now through relationship
            if (!string.IsNullOrEmpty(filter.Tags))
                query = query.Where(x => x.CatalogTopicTags!.Any(ct => ct.Tag!.TagName.Contains(filter.Tags)));

            // Filter by department - prefer Code-based filtering
            if (!string.IsNullOrEmpty(filter.DepartmentCode))
                query = query.Where(x => x.DepartmentCode == filter.DepartmentCode);


            // Filter by owner lecturer
            if (!string.IsNullOrEmpty(filter.OwnerLecturerCode))
                query = query.Where(x => x.Department!.LecturerProfiles!.Any(lp => lp.LecturerCode == filter.OwnerLecturerCode));


            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<Topic> ApplyFilter(this IQueryable<Topic> query, TopicFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.Title.Contains(filter.Search) ||
                                        x.TopicCode.Contains(filter.Search) ||
                                        (x.Summary != null && x.Summary.Contains(filter.Search)));
            }

            if (!string.IsNullOrEmpty(filter.Title))
                query = query.Where(x => x.Title.Contains(filter.Title));

            if (!string.IsNullOrEmpty(filter.TopicCode))
                query = query.Where(x => x.TopicCode.Contains(filter.TopicCode));

            // Tags filtering removed - TopicTags navigation property no longer exists
            // if (!string.IsNullOrEmpty(filter.Tags))
            //     query = query.Where(x => x.TopicTags!.Any(tt => tt.Tag!.TagName.Contains(filter.Tags)));

            if (!string.IsNullOrEmpty(filter.Type))
                query = query.Where(x => x.Type == filter.Type);

            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(x => x.Status == filter.Status);

            if (!string.IsNullOrWhiteSpace(filter.ProposerUserCode))
                query = query.Where(x => x.ProposerUserCode == filter.ProposerUserCode);

            if (!string.IsNullOrWhiteSpace(filter.ProposerStudentCode))
                query = query.Where(x => x.ProposerStudentCode == filter.ProposerStudentCode);

            if (!string.IsNullOrWhiteSpace(filter.SupervisorUserCode))
                query = query.Where(x => x.SupervisorUserCode == filter.SupervisorUserCode);

            if (!string.IsNullOrWhiteSpace(filter.DepartmentCode))
                query = query.Where(x => x.DepartmentCode == filter.DepartmentCode);

            if (!string.IsNullOrWhiteSpace(filter.CatalogTopicCode))
                query = query.Where(x => x.CatalogTopicCode == filter.CatalogTopicCode);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<Committee> ApplyFilter(this IQueryable<Committee> query, CommitteeFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.CommitteeCode.Contains(filter.Search) ||
                                        (x.Name != null && x.Name.Contains(filter.Search)) ||
                                        (x.Room != null && x.Room.Contains(filter.Search)));
            }

            if (!string.IsNullOrEmpty(filter.Name))
                query = query.Where(x => x.Name != null && x.Name.Contains(filter.Name));

            if (!string.IsNullOrEmpty(filter.CommitteeCode))
                query = query.Where(x => x.CommitteeCode.Contains(filter.CommitteeCode));

            if (!string.IsNullOrEmpty(filter.Room))
                query = query.Where(x => x.Room != null && x.Room.Contains(filter.Room));

            if (filter.DefenseDate.HasValue)
                query = query.Where(x => x.DefenseDate.HasValue && x.DefenseDate.Value.Date == filter.DefenseDate.Value.Date);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<ProgressMilestone> ApplyFilter(this IQueryable<ProgressMilestone> query, ProgressMilestoneFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.MilestoneCode.Contains(filter.Search) ||
                                        x.Type.Contains(filter.Search) ||
                                        (x.Note != null && x.Note.Contains(filter.Search)));
            }

            if (!string.IsNullOrWhiteSpace(filter.TopicCode))
                query = query.Where(x => x.TopicCode == filter.TopicCode);

            if (!string.IsNullOrEmpty(filter.Type))
                query = query.Where(x => x.Type == filter.Type);

            if (!string.IsNullOrEmpty(filter.State))
                query = query.Where(x => x.State == filter.State);

            if (!string.IsNullOrEmpty(filter.MilestoneCode))
                query = query.Where(x => x.MilestoneCode.Contains(filter.MilestoneCode));

            if (filter.Deadline.HasValue)
                query = query.Where(x => x.Deadline.HasValue && x.Deadline.Value.Date == filter.Deadline.Value.Date);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<DefenseAssignment> ApplyFilter(this IQueryable<DefenseAssignment> query, DefenseAssignmentFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.AssignmentCode.Contains(filter.Search));
            }

            if (!string.IsNullOrWhiteSpace(filter.TopicCode))
                query = query.Where(x => x.TopicCode == filter.TopicCode);

            if (!string.IsNullOrWhiteSpace(filter.CommitteeCode))
                query = query.Where(x => x.CommitteeCode == filter.CommitteeCode);

            if (!string.IsNullOrEmpty(filter.AssignmentCode))
                query = query.Where(x => x.AssignmentCode.Contains(filter.AssignmentCode));

            if (filter.ScheduledAt.HasValue)
                query = query.Where(x => x.ScheduledAt.HasValue && x.ScheduledAt.Value.Date == filter.ScheduledAt.Value.Date);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<Specialty> ApplyFilter(this IQueryable<Specialty> query, SpecialtyFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.Name.Contains(filter.Search) ||
                                        x.SpecialtyCode.Contains(filter.Search) ||
                                        (x.Description != null && x.Description.Contains(filter.Search)));
            }

            if (!string.IsNullOrEmpty(filter.Name))
                query = query.Where(x => x.Name.Contains(filter.Name));

            if (!string.IsNullOrEmpty(filter.SpecialtyCode))
                query = query.Where(x => x.SpecialtyCode.Contains(filter.SpecialtyCode));

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        private static IQueryable<T> ApplySorting<T>(IQueryable<T> query, BaseFilter filter)
        {
            if (string.IsNullOrEmpty(filter.SortBy))
                return query;

            var parameter = Expression.Parameter(typeof(T), "x");
            var property = Expression.Property(parameter, filter.SortBy);
            var lambda = Expression.Lambda(property, parameter);

            string methodName = filter.SortDescending ? "OrderByDescending" : "OrderBy";
            
            var resultExpression = Expression.Call(
                typeof(Queryable),
                methodName,
                new Type[] { typeof(T), property.Type },
                query.Expression,
                Expression.Quote(lambda)
            );

            return query.Provider.CreateQuery<T>(resultExpression);
        }

        public static IQueryable<CommitteeMember> ApplyFilter(this IQueryable<CommitteeMember> query, CommitteeMemberFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.Role.Contains(filter.Search));
            }

            if (!string.IsNullOrWhiteSpace(filter.CommitteeCode))
                query = query.Where(x => x.Committee!.CommitteeCode == filter.CommitteeCode);

            if (!string.IsNullOrWhiteSpace(filter.LecturerUserCode))
                query = query.Where(x => x.MemberUser!.UserCode == filter.LecturerUserCode);

            if (!string.IsNullOrWhiteSpace(filter.LecturerCode))
                query = query.Where(x => x.MemberLecturerProfile!.LecturerCode == filter.LecturerCode);

            if (!string.IsNullOrEmpty(filter.Role))
                query = query.Where(x => x.Role.Contains(filter.Role));

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<DefenseScore> ApplyFilter(this IQueryable<DefenseScore> query, DefenseScoreFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.ScoreCode.Contains(filter.Search) ||
                                        (x.Comment != null && x.Comment.Contains(filter.Search)));
            }

            if (!string.IsNullOrEmpty(filter.ScoreCode))
                query = query.Where(x => x.ScoreCode.Contains(filter.ScoreCode));

            if (!string.IsNullOrWhiteSpace(filter.AssignmentCode))
                query = query.Where(x => x.AssignmentCode == filter.AssignmentCode);

            if (!string.IsNullOrWhiteSpace(filter.MemberLecturerUserCode))
                query = query.Where(x => x.MemberLecturerUserCode == filter.MemberLecturerUserCode);

            if (!string.IsNullOrWhiteSpace(filter.MemberLecturerCode))
                query = query.Where(x => x.MemberLecturerCode == filter.MemberLecturerCode);

            if (filter.MinScore.HasValue)
                query = query.Where(x => x.Score >= filter.MinScore.Value);

            if (filter.MaxScore.HasValue)
                query = query.Where(x => x.Score <= filter.MaxScore.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<LecturerSpecialty> ApplyFilter(this IQueryable<LecturerSpecialty> query, LecturerSpecialtyFilter filter)
        {
            if (!string.IsNullOrWhiteSpace(filter.LecturerCode))
                query = query.Where(x => x.LecturerProfile!.LecturerCode == filter.LecturerCode);

            if (!string.IsNullOrWhiteSpace(filter.SpecialtyCode))
                query = query.Where(x => x.Specialty!.SpecialtyCode == filter.SpecialtyCode);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<TopicLecturer> ApplyFilter(this IQueryable<TopicLecturer> query, TopicLecturerFilter filter)
        {
            if (!string.IsNullOrWhiteSpace(filter.TopicCode))
                query = query.Where(x => x.TopicCode == filter.TopicCode);

            if (!string.IsNullOrWhiteSpace(filter.LecturerCode))
                query = query.Where(x => x.LecturerProfile!.LecturerCode == filter.LecturerCode);

            if (filter.IsPrimary.HasValue)
                query = query.Where(x => x.IsPrimary == filter.IsPrimary.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }

        public static IQueryable<ProgressSubmission> ApplyFilter(this IQueryable<ProgressSubmission> query, ProgressSubmissionFilter filter)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(x => x.SubmissionCode.Contains(filter.Search) ||
                                        (x.LecturerComment != null && x.LecturerComment.Contains(filter.Search)));
            }

            if (!string.IsNullOrEmpty(filter.SubmissionCode))
                query = query.Where(x => x.SubmissionCode.Contains(filter.SubmissionCode));

            if (!string.IsNullOrWhiteSpace(filter.MilestoneCode))
                query = query.Where(x => x.MilestoneCode == filter.MilestoneCode);

            if (!string.IsNullOrWhiteSpace(filter.StudentUserCode))
                query = query.Where(x => x.StudentUserCode == filter.StudentUserCode);

            if (!string.IsNullOrWhiteSpace(filter.StudentProfileCode))
                query = query.Where(x => x.StudentProfileCode == filter.StudentProfileCode);

            if (!string.IsNullOrEmpty(filter.LecturerState))
                query = query.Where(x => x.LecturerState != null && x.LecturerState.Contains(filter.LecturerState));

            if (filter.SubmittedFrom.HasValue)
                query = query.Where(x => x.SubmittedAt >= filter.SubmittedFrom.Value);

            if (filter.SubmittedTo.HasValue)
                query = query.Where(x => x.SubmittedAt <= filter.SubmittedTo.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.LastUpdated >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.LastUpdated <= filter.ToDate.Value);

            return ApplySorting(query, filter);
        }
    }
}