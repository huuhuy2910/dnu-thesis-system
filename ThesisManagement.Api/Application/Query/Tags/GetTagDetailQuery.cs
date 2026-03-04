using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Tags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Tags
{
    public interface IGetTagDetailQuery
    {
        Task<TagReadDto?> ExecuteAsync(string code);
    }

    public class GetTagDetailQuery : IGetTagDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetTagDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<TagReadDto?> ExecuteAsync(string code)
        {
            var item = await _uow.Tags.Query().FirstOrDefaultAsync(x => x.TagCode == code);
            return item == null ? null : _mapper.Map<TagReadDto>(item);
        }
    }
}
