using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.Application.Common;

namespace ThesisManagement.Api.Services.FileStorage
{
    public sealed record FileStorageReadResult(Stream Stream, string ContentType, string FileName);

    public sealed record FileStorageListItem(
        string Id,
        string Name,
        string Url,
        long? SizeBytes,
        DateTime? ModifiedAt,
        string Provider);

    public interface IFileStorageService
    {
        long MaxUploadSizeBytes { get; }

        Task<OperationResult<string>> UploadAsync(IFormFile file, string scope, CancellationToken cancellationToken = default, bool allowLocalFallback = true);
        Task<OperationResult<FileStorageReadResult>> OpenReadAsync(string? url, CancellationToken cancellationToken = default);
        Task<OperationResult<object?>> DeleteAsync(string? url, CancellationToken cancellationToken = default);
        Task<OperationResult<string>> MoveAsync(string? url, string targetScope, CancellationToken cancellationToken = default);
        Task<OperationResult<IReadOnlyList<FileStorageListItem>>> ListAsync(string scope, CancellationToken cancellationToken = default);
        bool IsManagedUrl(string? url);
        string? ToAbsoluteUrl(string? url);
    }
}