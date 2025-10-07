using System;

namespace ThesisManagement.Api.Services
{
    public class CodeGeneratorService : ICodeGenerator
    {
        // Simple thread-safe generator: prefix + yyyyMMddHHmmss + random 3-digit
        public string Generate(string prefix)
        {
            var now = DateTime.UtcNow;
            var stamp = now.ToString("yyyyMMddHHmmss");
            var rnd = new Random().Next(100, 999);
            return $"{prefix}_{stamp}_{rnd}";
        }
    }
}
