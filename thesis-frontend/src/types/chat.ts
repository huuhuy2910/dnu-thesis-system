export type ChatId = number;

export interface ChatConversation {
  conversationID: number;
  conversationCode: string;
  conversationType: "Direct" | "Group" | string;
  title?: string | null;
  createdByUserID: number;
  createdByUserCode: string;
  avatarURL?: string | null;
  lastMessageID?: number | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  isArchived: boolean;
  createdAt?: string | null;
  lastUpdated?: string | null;
}

export interface ChatConversationFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  conversationCode?: string;
  conversationType?: string;
  createdByUserCode?: string;
  isArchived?: boolean;
}

export interface CreateConversationPayload {
  conversationType: "Direct" | "Group";
  title?: string | null;
  createdByUserID: number;
  createdByUserCode: string;
  avatarURL?: string | null;
  isArchived: boolean;
}

export interface UpdateConversationPayload {
  conversationType?: "Direct" | "Group" | null;
  title?: string | null;
  avatarURL?: string | null;
  isArchived?: boolean;
  lastUpdated?: string | null;
}

export interface ChatConversationMember {
  memberID: number;
  conversationID: number;
  conversationCode?: string | null;
  userID: number;
  userCode: string;
  memberRole: "Owner" | "Admin" | "Member" | string;
  nickName?: string | null;
  isMuted: boolean;
  isPinned: boolean;
  joinedAt?: string | null;
  leftAt?: string | null;
  lastReadMessageID?: number | null;
  lastReadAt?: string | null;
  unreadCount?: number | null;
  userRole?: string;
  fullName?: string;
  avatarURL?: string | null;
}

export interface CreateConversationMemberPayload {
  conversationID: number;
  userID: number;
  userCode: string;
  memberRole: "Owner" | "Admin" | "Member";
  isMuted: boolean;
  isPinned: boolean;
}

export interface UpdateConversationMemberPayload {
  memberRole?: "Owner" | "Admin" | "Member" | null;
  nickName?: string | null;
  isMuted?: boolean;
  isPinned?: boolean;
  joinedAt?: string | null;
  leftAt?: string | null;
  lastReadMessageID?: number | null;
  lastReadAt?: string | null;
  unreadCount?: number;
}

export interface ChatMessageAttachment {
  attachmentID: number;
  messageID: number;
  fileURL: string;
  fileUrl?: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  thumbnailURL?: string | null;
  thumbnailUrl?: string | null;
  uploadedAt?: string | null;
  uploadStatus?: "uploading" | "uploaded" | "failed";
  uploadError?: string | null;
  localPreviewURL?: string | null;
  localFile?: File;
}

export interface CreateMessageAttachmentPayload {
  messageID: number;
  fileURL: string;
  fileUrl?: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  thumbnailURL?: string | null;
  thumbnailUrl?: string | null;
}

export interface UpdateMessageAttachmentPayload {
  fileURL?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  thumbnailURL?: string | null;
  thumbnailUrl?: string | null;
}

export interface ChatMessage {
  messageID: number;
  conversationID: number;
  senderUserCode: string;
  content?: string | null;
  messageType: string;
  replyToMessageID?: number | null;
  isDeleted: boolean;
  sentAt?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  attachments?: ChatMessageAttachment[];
  reactions?: ChatMessageReaction[];
  readReceipts?: ChatMessageReadReceipt[];
  receiptCount?: number;
  isOptimistic?: boolean;
}

export interface ChatMessageFilter {
  page?: number;
  pageSize?: number;
  conversationID?: number;
  senderUserCode?: string;
  messageType?: string;
  isDeleted?: boolean;
}

export interface CreateMessagePayload {
  conversationID: number;
  senderUserCode: string;
  content?: string | null;
  messageType?: string;
  replyToMessageID?: number | null;
}

export interface UpdateMessagePayload {
  content?: string | null;
  messageType?: string | null;
  isDeleted?: boolean;
  editedAt?: string | null;
  deletedAt?: string | null;
}

export interface ChatMessageReaction {
  reactionID: number;
  messageID: number;
  userCode: string;
  reactionType: string;
  reactedAt?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface CreateReactionPayload {
  messageID: number;
  userCode: string;
  reactionType: string;
}

export interface CreateReactionUpdatePayload {
  reactionType?: string;
}

export interface ChatMessageReadReceipt {
  receiptID: number;
  messageID: number;
  userID: number;
  userCode?: string;
  readAt?: string | null;
}

export interface MessageReadReceiptFilter {
  page?: number;
  pageSize?: number;
  messageID?: number;
  userCode?: string;
}

export interface CreateMessageReadReceiptPayload {
  messageID: number;
  userCode: string;
  readAt?: string | null;
}

export interface UpdateMessageReadReceiptPayload {
  readAt?: string | null;
}

export type ChatRealtimeEventType =
  | "message.created"
  | "message.updated"
  | "message.deleted"
  | "message.attachment.created"
  | "message.attachment.updated"
  | "message.attachment.deleted"
  | "reaction.created"
  | "reaction.updated"
  | "reaction.deleted"
  | "message.reaction.created"
  | "message.reaction.updated"
  | "message.reaction.deleted"
  | "receipt.updated"
  | "unknown";

export interface ChatRealtimeEvent {
  type: ChatRealtimeEventType;
  conversationCode?: string;
  conversationID?: number;
  messageID?: number;
  payload: unknown;
}
