namespace ThesisManagement.Api.Application.Common
{
    public sealed class BusinessRuleException : Exception
    {
        public string Code { get; }
        public object? Details { get; }

        public BusinessRuleException(string message, string code = "BUSINESS_RULE_VIOLATION", object? details = null)
            : base(message)
        {
            Code = code;
            Details = details;
        }
    }
}
