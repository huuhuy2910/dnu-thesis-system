using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ThesisManagement.Api.Models
{
    [Table("NOTIFICATIONS")]
    public class Notification
    {
        [Key]
        [Column("NOTIFICATION_ID")]
        public int NotificationID { get; set; }

        [Column("NOTIFICATION_CODE")]
        public string NotificationCode { get; set; } = null!;

        [Column("NOTIF_CHANNEL")]
        public string NotifChannel { get; set; } = "IN_APP";

        [Column("NOTIF_CATEGORY")]
        public string NotifCategory { get; set; } = null!;

        [Column("NOTIF_TITLE")]
        public string NotifTitle { get; set; } = null!;

        [Column("NOTIF_BODY")]
        public string NotifBody { get; set; } = null!;

        [Column("NOTIF_PRIORITY")]
        public string NotifPriority { get; set; } = "NORMAL";

        [Column("ACTION_TYPE")]
        public string? ActionType { get; set; }

        [Column("ACTION_URL")]
        public string? ActionUrl { get; set; }

        [Column("IMAGE_URL")]
        public string? ImageUrl { get; set; }

        [Column("RELATED_ENTITY_NAME")]
        public string? RelatedEntityName { get; set; }

        [Column("RELATED_ENTITY_CODE")]
        public string? RelatedEntityCode { get; set; }

        [Column("RELATED_ENTITY_ID")]
        public int? RelatedEntityID { get; set; }

        [Column("TRIGGERED_BY_USER_ID")]
        public int? TriggeredByUserID { get; set; }

        [Column("TRIGGERED_BY_USER_CODE")]
        public string? TriggeredByUserCode { get; set; }

        [Column("IS_GLOBAL")]
        public int IsGlobal { get; set; } = 0;

        [Column("SCHEDULE_AT")]
        public DateTime? ScheduleAt { get; set; }

        [Column("EXPIRES_AT")]
        public DateTime? ExpiresAt { get; set; }

        [Column("CREATED_AT")]
        public DateTime CreatedAt { get; set; }

        [Column("UPDATED_AT")]
        public DateTime? UpdatedAt { get; set; }

        public ICollection<NotificationRecipient>? Recipients { get; set; }
    }
}
