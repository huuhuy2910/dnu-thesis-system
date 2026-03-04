using AutoMapper;
using ThesisManagement.Api.DTOs.Users.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Users
{
    public interface IGetUserDetailQuery
    {
        Task<UserReadDto?> ExecuteAsync(string code);
    }

    public class GetUserDetailQuery : IGetUserDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetUserDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<UserReadDto?> ExecuteAsync(string code)
        {
            var user = await _uow.Users.GetByCodeAsync(code);
            return user == null ? null : _mapper.Map<UserReadDto>(user);
        }
    }
}
