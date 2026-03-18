export type NotificationDeliveryState =
  | "PENDING"
  | "DELIVERED"
  | "FAILED"
  | "DISMISSED"
  | string;

export type NotificationPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT"
  | string;

export interface NotificationContentDto {
  notificationID: number;
  notificationCode: string;
  notifChannel: string;
  notifCategory: string;
  notifTitle: string;
  notifBody: string;
  notifPriority: NotificationPriority;
  actionType: string | null;
  actionUrl: string | null;
  imageUrl: string | null;
  relatedEntityName: string | null;
  relatedEntityCode: string | null;
  relatedEntityID: number | null;
  triggeredByUserCode: string | null;
  isGlobal: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export interface NotificationRecipientDto {
  recipientID: number;
  notificationID: number;
  targetUserID: number;
  targetUserCode: string;
  deliveryState: NotificationDeliveryState;
  isRead: boolean;
  readAt: string | null;
  seenAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
  notification: NotificationContentDto;
}

export interface NotificationUnreadCountDto {
  unreadCount: number;
}

export interface NotificationPreferenceDto {
  preferenceID: number;
  notifCategory: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  digestMode: string;
  quietFrom: string | null;
  quietTo: string | null;
  updatedAt: string;
}

export interface UpdateNotificationPreferenceInput {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  digestMode: string;
  quietFrom: string | null;
  quietTo: string | null;
}

export interface NotificationFeedQuery {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  notifCategory?: string;
  notifPriority?: string;
  includeDismissed?: boolean;
}

export interface NotificationCreatedEvent {
  recipientID: number;
  notificationCode: string;
  notifCategory: string;
  notifTitle: string;
  actionUrl: string | null;
  notifPriority: NotificationPriority;
  isRead: boolean;
  createdAtIso: string;
  unreadCount?: number;
}
