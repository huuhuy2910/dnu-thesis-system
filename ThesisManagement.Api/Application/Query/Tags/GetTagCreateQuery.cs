using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Tags.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Tags
{
    public interface IGetTagCreateQuery
    {
        Task<TagCreateDto> ExecuteAsync();
    }

    public class GetTagCreateQuery : IGetTagCreateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetTagCreateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<TagCreateDto> ExecuteAsync()
        {
            var code = await GenerateTagCodeAsync();
            return new TagCreateDto(code, string.Empty, null);
        }

        private async Task<string> GenerateTagCodeAsync()
        {
            var today = DateTime.Now;
            var prefix = $"TAG{today:yyyyMMdd}";
            var lastCode = await _uow.Tags.Query()
                .Where(x => x.TagCode.StartsWith(prefix))
                .OrderByDescending(x => x.TagCode)
                .Select(x => x.TagCode)
                .FirstOrDefaultAsync();

            if (lastCode == null)
                return $"{prefix}001";

            var lastNumber = int.Parse(lastCode.Substring(prefix.Length));
            return $"{prefix}{(lastNumber + 1):D3}";
        }
    }
}
