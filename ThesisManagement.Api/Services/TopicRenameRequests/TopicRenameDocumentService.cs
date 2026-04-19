using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Hosting;
using ThesisManagement.Api.DTOs.TopicRenameRequests.Query;

namespace ThesisManagement.Api.Services.TopicRenameRequests
{
    public sealed class TopicRenameDocumentService : ITopicRenameDocumentService
    {
        private const string TemplateFileName = "ĐƠN XIN THAY ĐỔI TÊN ĐỀ TÀI.docx";
        private readonly IWebHostEnvironment _environment;

        public TopicRenameDocumentService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task<byte[]> BuildTemplateAsync(TopicRenameTemplateDataDto data, CancellationToken cancellationToken = default)
        {
            var templatePath = Path.Combine(_environment.ContentRootPath, "Templates", TemplateFileName);
            if (!File.Exists(templatePath))
                throw new FileNotFoundException($"Template file not found: {templatePath}", templatePath);

            var templateBytes = await File.ReadAllBytesAsync(templatePath, cancellationToken);
            using var memory = new MemoryStream(templateBytes);
            using (var document = WordprocessingDocument.Open(memory, true))
            {
                var mainDocumentPart = document.MainDocumentPart ?? throw new InvalidOperationException("Template document is missing a main document part.");
                var mainDocument = mainDocumentPart.Document ?? throw new InvalidOperationException("Template document is missing the document body.");
                var replacements = new Dictionary<string, string?>
                {
                    ["{{StudentName}}"] = data.StudentFullName,
                    ["{{DateOfBirth}}"] = data.DateOfBirth,
                    ["{{PlaceOfBirth}}"] = data.PlaceOfBirth,
                    ["{{StudentCode}}"] = data.StudentCode,
                    ["{{EnrollmentYear}}"] = data.EnrollmentYear,
                    ["{{ClassName}}"] = data.ClassName,
                    ["{{MajorName}}"] = data.MajorName,
                    ["{{PhoneNumber}}"] = data.PhoneNumber,
                    ["{{Email}}"] = data.Email,
                    ["{{CurrentTopicTitle}}"] = data.CurrentTopicTitle,
                    ["{{SupervisorName}}"] = data.SupervisorName,
                    ["{{NewTopicTitle}}"] = data.NewTopicTitle,
                    ["{{Reason}}"] = data.Reason,
                    ["{{DepartmentName}}"] = data.DepartmentName
                };

                ReplaceText(mainDocument, replacements);

                foreach (var headerPart in mainDocumentPart.HeaderParts)
                    ReplaceText(headerPart.Header, replacements);

                foreach (var footerPart in mainDocumentPart.FooterParts)
                    ReplaceText(footerPart.Footer, replacements);

                mainDocument.Save();
            }

            return memory.ToArray();
        }

        private static void ReplaceText(OpenXmlPartRootElement? root, IReadOnlyDictionary<string, string?> replacements)
        {
            if (root == null)
                return;

            foreach (var paragraph in root.Descendants<Paragraph>())
            {
                var texts = paragraph.Descendants<Text>().ToList();
                if (texts.Count == 0)
                    continue;

                var value = string.Concat(texts.Select(x => x.Text));
                var replaced = value;

                foreach (var replacement in replacements)
                {
                    if (!replaced.Contains(replacement.Key, StringComparison.Ordinal))
                        continue;

                    replaced = replaced.Replace(replacement.Key, replacement.Value ?? string.Empty, StringComparison.Ordinal);
                }

                if (!string.Equals(value, replaced, StringComparison.Ordinal))
                {
                    texts[0].Text = replaced;
                    for (var i = 1; i < texts.Count; i++)
                    {
                        texts[i].Text = string.Empty;
                    }
                }
            }
        }

    }
}