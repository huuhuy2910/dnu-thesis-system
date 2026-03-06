using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.Tags;
using ThesisManagement.Api.DTOs.Tags.Command;
using ThesisManagement.Api.DTOs.Tags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Tags
{
    public interface IUpdateTagCommand
    {
        Task<OperationResult<TagReadDto>> ExecuteAsync(int id, TagUpdateDto dto);
    }

    public class UpdateTagCommand : IUpdateTagCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateTagCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<TagReadDto>> ExecuteAsync(int id, TagUpdateDto dto)
        {
            var validationError = TagCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<TagReadDto>.Failed(validationError, 400);

            var entity = await _uow.Tags.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<TagReadDto>.Failed("Tag not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.TagName))
                entity.TagName = dto.TagName.Trim();

            if (dto.Description is not null)
                entity.Description = dto.Description;

            _uow.Tags.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<TagReadDto>.Succeeded(_mapper.Map<TagReadDto>(entity));
        }
    }
}
