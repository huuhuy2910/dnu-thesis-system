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
                .ForMember(dest => dest.DepartmentCode, opt => opt.MapFrom(src => src.DepartmentCode))
                .ForMember(dest => dest.SpecialtyID, opt => opt.MapFrom(src => src.SpecialtyID))
                .ForMember(dest => dest.SpecialtyCode, opt => opt.MapFrom(src => src.SpecialtyCode));
            CreateMap<ProgressMilestone, ProgressMilestoneReadDto>();
            CreateMap<ProgressSubmission, ProgressSubmissionReadDto>();
            CreateMap<Tag, TagDto>();
            CreateMap<DefenseScore, DefenseScoreReadDto>();
            
            // New mappings for specialty-related models
            CreateMap<Specialty, SpecialtyReadDto>();
            CreateMap<LecturerSpecialty, LecturerSpecialtyReadDto>();
            CreateMap<TopicLecturer, TopicLecturerReadDto>();
            CreateMap<CatalogTopicSpecialty, CatalogTopicSpecialtyReadDto>();
        }
    }
}
