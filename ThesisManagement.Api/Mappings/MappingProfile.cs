using AutoMapper;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.DTOs;

namespace ThesisManagement.Api.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Department, DepartmentReadDto>();
            CreateMap<User, UserReadDto>();
            CreateMap<User, LoginResponseDto>();
            CreateMap<StudentProfile, StudentProfileReadDto>();
            CreateMap<LecturerProfile, LecturerProfileReadDto>();
            CreateMap<CatalogTopic, CatalogTopicReadDto>();
            CreateMap<Topic, TopicReadDto>()
                .ForMember(dest => dest.ProposerStudentProfileID, opt => opt.MapFrom(src => src.ProposerStudentProfileID))
                .ForMember(dest => dest.SupervisorLecturerProfileID, opt => opt.MapFrom(src => src.SupervisorLecturerProfileID))
                .ForMember(dest => dest.CatalogTopicID, opt => opt.MapFrom(src => src.CatalogTopicID))
                .ForMember(dest => dest.CatalogTopicCode, opt => opt.MapFrom(src => src.CatalogTopicCode))
                .ForMember(dest => dest.DepartmentID, opt => opt.MapFrom(src => src.DepartmentID))
                .ForMember(dest => dest.DepartmentCode, opt => opt.MapFrom(src => src.DepartmentCode));
            CreateMap<ProgressMilestone, ProgressMilestoneReadDto>()
                .ForMember(dest => dest.CompletedAt1, opt => opt.MapFrom(src => src.CompletedAt1))
                .ForMember(dest => dest.CompletedAt2, opt => opt.MapFrom(src => src.CompletedAt2))
                .ForMember(dest => dest.CompletedAt3, opt => opt.MapFrom(src => src.CompletedAt3))
                .ForMember(dest => dest.CompletedAt4, opt => opt.MapFrom(src => src.CompletedAt4))
                .ForMember(dest => dest.CompletedAt5, opt => opt.MapFrom(src => src.CompletedAt5));
            CreateMap<ProgressSubmission, ProgressSubmissionReadDto>();
            CreateMap<MilestoneTemplate, MilestoneTemplateReadDto>();
            CreateMap<MilestoneStateHistory, MilestoneStateHistoryReadDto>();
            CreateMap<SubmissionFile, SubmissionFileReadDto>();
            // TODO: CreateMap<Committee, CommitteeReadDto>();
            // TODO: CreateMap<CommitteeMember, CommitteeMemberReadDto>();
            // TODO: CreateMap<DefenseAssignment, DefenseAssignmentReadDto>();
            CreateMap<DefenseScore, DefenseScoreReadDto>();
            
            CreateMap<Tag, TagReadDto>();
            CreateMap<TopicLecturer, TopicLecturerReadDto>();
            CreateMap<LecturerTag, LecturerTagReadDto>();
            CreateMap<CatalogTopicTag, CatalogTopicTagReadDto>();
            CreateMap<TopicTag, TopicTagReadDto>();
        }
    }
}
