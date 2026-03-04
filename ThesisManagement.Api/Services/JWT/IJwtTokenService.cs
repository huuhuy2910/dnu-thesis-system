using ThesisManagement.Api.Models;

namespace ThesisManagement.Api.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user);
        DateTime GetTokenExpiryUtc();
    }
}
