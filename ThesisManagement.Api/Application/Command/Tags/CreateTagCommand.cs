using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.Tags;
using ThesisManagement.Api.DTOs.Tags.Command;
using ThesisManagement.Api.DTOs.Tags.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Tags
{
    public interface ICreateTagCommand
    {
        Task<OperationResult<TagReadDto>> ExecuteAsync(TagCreateDto dto);
    }

    public class CreateTagCommand : ICreateTagCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public CreateTagCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<TagReadDto>> ExecuteAsync(TagCreateDto dto)
        {
            var validationError = TagCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<TagReadDto>.Failed(validationError, 400);

            var code = string.IsNullOrWhiteSpace(dto.TagCode)
                ? await GenerateTagCodeAsync()
                : dto.TagCode.Trim();

            var existing = await _uow.Tags.Query().FirstOrDefaultAsync(x => x.TagCode == code);
            if (existing != null)
                return OperationResult<TagReadDto>.Failed($"Tag with code '{code}' already exists", 400);

            var entity = new Tag
            {
                TagCode = code,
                TagName = dto.TagName.Trim(),
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow
            };

            await _uow.Tags.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<TagReadDto>.Succeeded(_mapper.Map<TagReadDto>(entity));
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
