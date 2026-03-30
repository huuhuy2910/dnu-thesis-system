using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ThesisManagement.Api.Models
{
    [Table("NOTIFICATION_RECIPIENTS")]
    public class NotificationRecipient
    {
        [Key]
        [Column("RECIPIENT_ID")]
        public int RecipientID { get; set; }

        [Column("NOTIFICATION_ID")]
        public int NotificationID { get; set; }

        [Column("TARGET_USER_ID")]
        public int TargetUserID { get; set; }

        [Column("TARGET_USER_CODE")]
        public string TargetUserCode { get; set; } = null!;

        [Column("DELIVERY_STATE")]
        public string DeliveryState { get; set; } = "PENDING";

        [Column("IS_READ")]
        public int IsRead { get; set; } = 0;

        [Column("READ_AT")]
        public DateTime? ReadAt { get; set; }

        [Column("SEEN_AT")]
        public DateTime? SeenAt { get; set; }

        [Column("DISMISSED_AT")]
        public DateTime? DismissedAt { get; set; }

        [Column("DELIVERED_AT")]
        public DateTime? DeliveredAt { get; set; }

        [Column("ERROR_MESSAGE")]
        public string? ErrorMessage { get; set; }

        [Column("CREATED_AT")]
        public DateTime CreatedAt { get; set; }

        [Column("UPDATED_AT")]
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey(nameof(NotificationID))]
        public Notification? Notification { get; set; }

        [ForeignKey(nameof(TargetUserID))]
        public User? TargetUser { get; set; }
    }
}
