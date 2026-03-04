namespace ThesisManagement.Api.DTOs.MessageReadReceipts.Query
{
    public class MessageReadReceiptFilter : BaseFilter
    {
        public int? MessageID { get; set; }
        public string? UserCode { get; set; }
    }
}
