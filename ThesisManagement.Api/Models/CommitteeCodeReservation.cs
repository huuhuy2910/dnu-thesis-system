namespace ThesisManagement.Api.Models
{
	public class CommitteeCodeReservation
	{
		public int CommitteeCodeReservationId { get; set; }
		public int PeriodId { get; set; }
		public int Year { get; set; }
		public int Sequence { get; set; }
		public string CommitteeCode { get; set; } = string.Empty;
		public string Status { get; set; } = "Reserved";
		public string? RequestKey { get; set; }
		public DateTime ReservedAt { get; set; }
		public DateTime ExpiresAt { get; set; }
		public DateTime? CommittedAt { get; set; }
	}
}
