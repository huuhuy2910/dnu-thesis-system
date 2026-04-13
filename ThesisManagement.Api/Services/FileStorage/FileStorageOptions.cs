namespace ThesisManagement.Api.Services.FileStorage
{
    public sealed class FileStorageOptions
    {
        public bool EnableMega { get; set; } = true;
        public string? MegaEmail { get; set; }
        public string? MegaPassword { get; set; }
        public string? MegaMfaKey { get; set; }
        public string MegaRootFolder { get; set; } = "ThesisManagement";
        public string? PublicBaseUrl { get; set; }
        public long MaxUploadSizeBytes { get; set; } = 10 * 1024 * 1024;
    }
}