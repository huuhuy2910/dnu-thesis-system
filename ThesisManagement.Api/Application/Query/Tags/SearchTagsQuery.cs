using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Tags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Tags
{
    public interface ISearchTagsQuery
    {
        Task<List<TagReadDto>> ExecuteAsync(string q);
    }

    public class SearchTagsQuery : ISearchTagsQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public SearchTagsQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<List<TagReadDto>> ExecuteAsync(string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return new List<TagReadDto>();

            var items = await _uow.Tags.Query()
                .Where(x => x.TagName.Contains(q) || x.TagCode.Contains(q))
                .OrderBy(x => x.TagName)
                .Take(20)
                .ToListAsync();

            return _mapper.Map<List<TagReadDto>>(items);
        }
    }
}
