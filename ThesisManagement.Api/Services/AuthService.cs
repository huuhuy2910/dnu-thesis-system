using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using BCrypt.Net;

namespace ThesisManagement.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _uow;

        public AuthService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<User?> ValidateUserAsync(string username, string password)
        {
            var user = await _uow.Users.Query()
                .FirstOrDefaultAsync(u => u.UserCode == username);

            if (user == null || !VerifyPassword(password, user.PasswordHash))
                return null;

            return user;
        }

        public bool VerifyPassword(string password, string hash)
        {
            try
            {
                // Kiểm tra nếu hash bắt đầu với $2 (BCrypt format)
                if (hash.StartsWith("$2"))
                {
                    return BCrypt.Net.BCrypt.Verify(password, hash);
                }
                else
                {
                    // Mật khẩu chưa được mã hóa, so sánh trực tiếp
                    return password == hash;
                }
            }
            catch
            {
                // Nếu BCrypt fail, thử so sánh trực tiếp
                return password == hash;
            }
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
}
