using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;

namespace ThesisManagement.Api.Services
{
    public interface IAuthService
    {
        Task<User?> ValidateUserAsync(string username, string password);
        bool VerifyPassword(string password, string hash);
        string HashPassword(string password);
    }
}
