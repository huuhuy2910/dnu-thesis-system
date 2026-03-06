using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.TopicLecturers
{
    public interface IDeleteTopicLecturerCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int topicId, int lecturerProfileId);
    }

    public class DeleteTopicLecturerCommand : IDeleteTopicLecturerCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteTopicLecturerCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int topicId, int lecturerProfileId)
        {
            var item = await _uow.TopicLecturers.Query().FirstOrDefaultAsync(x => x.TopicID == topicId && x.LecturerProfileID == lecturerProfileId);
            if (item == null)
                return OperationResult<object?>.Failed("TopicLecturer not found", 404);

            _uow.TopicLecturers.Remove(item);
            await _uow.SaveChangesAsync();
            return OperationResult<object?>.Succeeded(null);
        }
    }
}
