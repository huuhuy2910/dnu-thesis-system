using AutoMapper;
using ThesisManagement.Api.DTOs.Users.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Users
{
    public interface IGetUsersListQuery
    {
        Task<(IEnumerable<UserReadDto> Items, int TotalCount)> ExecuteAsync(UserFilter filter);
    }

    public class GetUsersListQuery : IGetUsersListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetUsersListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<UserReadDto> Items, int TotalCount)> ExecuteAsync(UserFilter filter)
        {
            var result = await _uow.Users.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));

            var items = result.Items.Select(x => _mapper.Map<UserReadDto>(x));
            return (items, result.TotalCount);
        }
    }
}
