import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import type { ApiResponse } from "../types/api";
import {
  clearAuthSession,
  getAccessToken,
  markSessionExpiredMessage,
} from "../services/auth-session.service";
import type {
  ChatConversation,
  ChatConversationFilter,
  ChatConversationMember,
  ChatMessage,
  ChatMessageAttachment,
  ChatMessageFilter,
  ChatMessageReadReceipt,
  ChatMessageReaction,
  CreateConversationMemberPayload,
  CreateConversationPayload,
  CreateMessageAttachmentPayload,
  CreateMessagePayload,
  CreateMessageReadReceiptPayload,
  CreateReactionPayload,
  CreateReactionUpdatePayload,
  MessageReadReceiptFilter,
  UpdateConversationMemberPayload,
  UpdateConversationPayload,
  UpdateMessageAttachmentPayload,
  UpdateMessagePayload,
  UpdateMessageReadReceiptPayload,
} from "../types/chat";

const envBaseRaw = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5180"
).toString();

const ensureScheme = (value: string) =>
  /^https?:\/\//i.test(value) ? value : `http://${value}`;

const normalizedBase = (() => {
  const base = ensureScheme(envBaseRaw.trim());
  return base.endsWith("/") ? base.slice(0, -1) : base;
})();

const apiBase = normalizedBase.endsWith("/api")
  ? normalizedBase
  : `${normalizedBase}/api`;

const chatClient: AxiosInstance = axios.create({
  baseURL: apiBase,
  timeout: 20000,
});

chatClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

chatClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearAuthSession();
      markSessionExpiredMessage(
        "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
      );
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export class ChatApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
  }
}

function toQueryParams(input: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.append(key, String(value));
  });
  return params;
}

function mapStatusMessage(status?: number): string {
  if (status === 401)
    return "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";
  if (status === 403) return "Bạn không có quyền truy cập hội thoại này.";
  if (status === 404) return "Không tìm thấy dữ liệu chat yêu cầu.";
  return "Không thể kết nối dịch vụ chat.";
}

function getEnvelopeMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    const candidate =
      source.errorMessage ?? source.message ?? source.title ?? source.code;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return fallback;
}

async function requestEnvelope<T>(
  config: AxiosRequestConfig,
  fallbackErrorMessage: string,
): Promise<T> {
  try {
    const response = await chatClient.request<ApiResponse<T>>(config);
    const envelope = response.data;

    if (!envelope?.success) {
      throw new ChatApiError(
        getEnvelopeMessage(envelope, fallbackErrorMessage),
        envelope?.httpStatusCode,
      );
    }

    return envelope.data as T;
  } catch (error) {
    if (error instanceof ChatApiError) throw error;

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message =
        getEnvelopeMessage(error.response?.data, mapStatusMessage(status)) ||
        fallbackErrorMessage;
      throw new ChatApiError(message, status);
    }

    throw new ChatApiError(fallbackErrorMessage);
  }
}

function normalizeConversation(
  source: Partial<ChatConversation>,
): ChatConversation {
  return {
    conversationID: Number(source.conversationID ?? 0),
    conversationCode: String(source.conversationCode ?? ""),
    conversationType: source.conversationType ?? "Direct",
    title: source.title ?? null,
    createdByUserID: Number(source.createdByUserID ?? 0),
    createdByUserCode: String(source.createdByUserCode ?? ""),
    avatarURL: source.avatarURL ?? null,
    lastMessageID:
      source.lastMessageID === null || source.lastMessageID === undefined
        ? null
        : Number(source.lastMessageID),
    lastMessagePreview: source.lastMessagePreview ?? null,
    lastMessageAt: source.lastMessageAt ?? null,
    isArchived: Boolean(source.isArchived),
    createdAt: source.createdAt ?? null,
    lastUpdated: source.lastUpdated ?? null,
  };
}

function normalizeMessage(source: Partial<ChatMessage>): ChatMessage {
  const normalizedAttachments = Array.isArray(source.attachments)
    ? source.attachments.map(normalizeAttachment)
    : [];

  return {
    messageID: Number(source.messageID ?? 0),
    conversationID: Number(source.conversationID ?? 0),
    senderUserCode: String(source.senderUserCode ?? ""),
    content: source.content ?? "",
    messageType: source.messageType ?? "TEXT",
    replyToMessageID:
      source.replyToMessageID === null || source.replyToMessageID === undefined
        ? null
        : Number(source.replyToMessageID),
    isDeleted: Boolean(source.isDeleted),
    sentAt: source.sentAt ?? null,
    editedAt: source.editedAt ?? null,
    deletedAt: source.deletedAt ?? null,
    attachments: normalizedAttachments,
    reactions: Array.isArray(source.reactions) ? source.reactions : [],
    receiptCount:
      typeof source.receiptCount === "number" ? source.receiptCount : 0,
    isOptimistic: Boolean(source.isOptimistic),
  };
}

function extractFileExtension(value?: string | null): string {
  if (!value) return "";
  const cleaned = String(value).split("?")[0].split("#")[0];
  const parts = cleaned.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

function inferMimeType(source: {
  mimeType?: string | null;
  fileName?: string | null;
  fileURL?: string | null;
  fileUrl?: string | null;
}): string | null {
  const mime = String(source.mimeType || "")
    .trim()
    .toLowerCase();
  if (mime) return mime;

  const extension =
    extractFileExtension(source.fileName) ||
    extractFileExtension(source.fileURL) ||
    extractFileExtension(source.fileUrl);

  const mimeByExtension: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    bmp: "image/bmp",
    webp: "image/webp",
    svg: "image/svg+xml",
    heic: "image/heic",
    heif: "image/heif",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",
    zip: "application/zip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",
  };

  return mimeByExtension[extension] || null;
}

function normalizeAttachment(
  source: Partial<ChatMessageAttachment>,
): ChatMessageAttachment {
  const fileURL = source.fileURL ?? source.fileUrl ?? "";
  const thumbnailURL = source.thumbnailURL ?? source.thumbnailUrl ?? null;

  return {
    attachmentID: Number(source.attachmentID ?? 0),
    messageID: Number(source.messageID ?? 0),
    fileURL,
    fileUrl: source.fileUrl ?? fileURL,
    fileName: source.fileName ?? null,
    mimeType: inferMimeType(source),
    fileSizeBytes:
      typeof source.fileSizeBytes === "number" ? source.fileSizeBytes : null,
    thumbnailURL,
    thumbnailUrl: source.thumbnailUrl ?? thumbnailURL,
    uploadedAt: source.uploadedAt ?? null,
    uploadStatus: source.uploadStatus,
    uploadError: source.uploadError ?? null,
    localPreviewURL: source.localPreviewURL ?? null,
    localFile: source.localFile,
  };
}

export const chatApi = {
  async listConversations(
    filter: ChatConversationFilter,
  ): Promise<ChatConversation[]> {
    const data = await requestEnvelope<ChatConversation[]>(
      {
        method: "GET",
        url: "/Conversations/list",
        params: toQueryParams(filter as Record<string, unknown>),
      },
      "Không thể tải danh sách hội thoại.",
    );
    return Array.isArray(data) ? data.map(normalizeConversation) : [];
  },

  async getConversation(
    conversationID: number,
  ): Promise<ChatConversation | null> {
    const data = await requestEnvelope<ChatConversation>(
      {
        method: "GET",
        url: `/Conversations/detail/${conversationID}`,
      },
      "Không thể tải chi tiết hội thoại.",
    );
    return data ? normalizeConversation(data) : null;
  },

  async createConversation(
    payload: CreateConversationPayload,
  ): Promise<ChatConversation> {
    const data = await requestEnvelope<ChatConversation>(
      {
        method: "POST",
        url: "/Conversations/create",
        data: payload,
      },
      "Không thể tạo hội thoại.",
    );
    return normalizeConversation(data);
  },

  async updateConversation(
    conversationID: number,
    payload: UpdateConversationPayload,
  ): Promise<ChatConversation> {
    const data = await requestEnvelope<ChatConversation>(
      {
        method: "PUT",
        url: `/Conversations/update/${conversationID}`,
        data: payload,
      },
      "Không thể cập nhật hội thoại.",
    );
    return normalizeConversation(data);
  },

  async listConversationMembers(
    conversationID: number,
  ): Promise<ChatConversationMember[]> {
    const data = await requestEnvelope<ChatConversationMember[]>(
      {
        method: "GET",
        url: "/ConversationMembers/list",
        params: toQueryParams({ page: 1, pageSize: 200, conversationID }),
      },
      "Không thể tải thành viên hội thoại.",
    );
    return Array.isArray(data) ? data : [];
  },

  async listConversationMembersByUser(
    userCode: string,
    page = 1,
    pageSize = 200,
  ): Promise<ChatConversationMember[]> {
    const data = await requestEnvelope<ChatConversationMember[]>(
      {
        method: "GET",
        url: "/ConversationMembers/list",
        params: toQueryParams({ page, pageSize, userCode }),
      },
      "Không thể tải danh sách hội thoại của người dùng.",
    );
    return Array.isArray(data) ? data : [];
  },

  async createConversationMember(
    payload: CreateConversationMemberPayload,
  ): Promise<ChatConversationMember> {
    return await requestEnvelope<ChatConversationMember>(
      {
        method: "POST",
        url: "/ConversationMembers/create",
        data: payload,
      },
      "Không thể thêm thành viên hội thoại.",
    );
  },

  async updateConversationMember(
    memberID: number,
    payload: UpdateConversationMemberPayload,
  ): Promise<ChatConversationMember> {
    return await requestEnvelope<ChatConversationMember>(
      {
        method: "PUT",
        url: `/ConversationMembers/update/${memberID}`,
        data: payload,
      },
      "Không thể cập nhật thành viên hội thoại.",
    );
  },

  async listMessages(filter: ChatMessageFilter): Promise<ChatMessage[]> {
    const data = await requestEnvelope<ChatMessage[]>(
      {
        method: "GET",
        url: "/Messages/list",
        params: toQueryParams(filter as Record<string, unknown>),
      },
      "Không thể tải danh sách tin nhắn.",
    );
    return Array.isArray(data) ? data.map(normalizeMessage) : [];
  },

  async sendMessage(payload: CreateMessagePayload): Promise<ChatMessage> {
    const data = await requestEnvelope<ChatMessage>(
      {
        method: "POST",
        url: "/Messages/create",
        data: {
          conversationID: payload.conversationID,
          senderUserCode: payload.senderUserCode,
          content: payload.content ?? "",
          messageType: payload.messageType ?? "TEXT",
          replyToMessageID: payload.replyToMessageID ?? null,
        },
      },
      "Không thể gửi tin nhắn.",
    );
    return normalizeMessage(data);
  },

  async updateMessage(
    messageID: number,
    payload: UpdateMessagePayload,
  ): Promise<ChatMessage> {
    const data = await requestEnvelope<ChatMessage>(
      {
        method: "PUT",
        url: `/Messages/update/${messageID}`,
        data: payload,
      },
      "Không thể cập nhật tin nhắn.",
    );
    return normalizeMessage(data);
  },

  async deleteMessage(messageID: number): Promise<void> {
    await requestEnvelope<unknown>(
      {
        method: "DELETE",
        url: `/Messages/delete/${messageID}`,
      },
      "Không thể xóa tin nhắn.",
    );
  },

  async listReactions(input: {
    messageID?: number;
    userCode?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ChatMessageReaction[]> {
    const { messageID, ...rest } = input;
    const data = await requestEnvelope<ChatMessageReaction[]>(
      {
        method: "GET",
        url: "/MessageReactions/list",
        params: toQueryParams({
          page: 1,
          pageSize: 200,
          ...rest,
          ...(typeof messageID === "number" ? { MessageID: messageID } : {}),
        }),
      },
      "Không thể tải danh sách biểu cảm.",
    );
    return Array.isArray(data) ? data : [];
  },

  async addReaction(
    payload: CreateReactionPayload,
  ): Promise<ChatMessageReaction> {
    return await requestEnvelope<ChatMessageReaction>(
      {
        method: "POST",
        url: "/MessageReactions/create",
        data: payload,
      },
      "Không thể thêm biểu cảm.",
    );
  },

  async updateReaction(
    reactionID: number,
    payload: CreateReactionUpdatePayload,
  ): Promise<ChatMessageReaction> {
    return await requestEnvelope<ChatMessageReaction>(
      {
        method: "PUT",
        url: `/MessageReactions/update/${reactionID}`,
        data: payload,
      },
      "Không thể cập nhật biểu cảm.",
    );
  },

  async deleteReaction(reactionID: number): Promise<void> {
    await requestEnvelope<unknown>(
      {
        method: "DELETE",
        url: `/MessageReactions/delete/${reactionID}`,
      },
      "Không thể gỡ biểu cảm.",
    );
  },

  async removeReactionByUser(
    messageID: number,
    userCode: string,
    reactionType: string,
  ): Promise<void> {
    const reactions = await chatApi.listReactions({ messageID, userCode });
    const target = reactions.find(
      (item) =>
        String(item.reactionType).toLowerCase() ===
        String(reactionType).toLowerCase(),
    );

    if (!target) return;

    await requestEnvelope<unknown>(
      {
        method: "DELETE",
        url: `/MessageReactions/delete/${target.reactionID}`,
      },
      "Không thể gỡ biểu cảm.",
    );
  },

  async listMessageReadReceipts(
    filter: MessageReadReceiptFilter,
  ): Promise<ChatMessageReadReceipt[]> {
    const data = await requestEnvelope<ChatMessageReadReceipt[]>(
      {
        method: "GET",
        url: "/MessageReadReceipts/list",
        params: toQueryParams(filter as Record<string, unknown>),
      },
      "Không thể tải trạng thái đã đọc.",
    );
    return Array.isArray(data) ? data : [];
  },

  async createMessageReadReceipt(
    payload: CreateMessageReadReceiptPayload,
  ): Promise<ChatMessageReadReceipt> {
    try {
      return await requestEnvelope<ChatMessageReadReceipt>(
        {
          method: "POST",
          url: "/MessageReadReceipts/create",
          data: payload,
        },
        "Không thể cập nhật trạng thái đã đọc.",
      );
    } catch (error) {
      if (!(error instanceof ChatApiError) || error.status !== 400) {
        throw error;
      }

      return await requestEnvelope<ChatMessageReadReceipt>(
        {
          method: "POST",
          url: "/MessageReadReceipts/create",
          data: { dto: payload },
        },
        "Không thể cập nhật trạng thái đã đọc.",
      );
    }
  },

  async updateMessageReadReceipt(
    receiptID: number,
    payload: UpdateMessageReadReceiptPayload,
  ): Promise<ChatMessageReadReceipt> {
    return await requestEnvelope<ChatMessageReadReceipt>(
      {
        method: "PUT",
        url: `/MessageReadReceipts/update/${receiptID}`,
        data: payload,
      },
      "Không thể cập nhật trạng thái đã đọc.",
    );
  },

  async listMessageAttachments(
    messageID: number,
  ): Promise<ChatMessageAttachment[]> {
    const data = await requestEnvelope<ChatMessageAttachment[]>(
      {
        method: "GET",
        url: "/MessageAttachments/list",
        params: toQueryParams({ page: 1, pageSize: 200, messageID }),
      },
      "Không thể tải tệp đính kèm.",
    );
    return Array.isArray(data)
      ? data.map((item) =>
          normalizeAttachment({ ...item, uploadStatus: "uploaded" }),
        )
      : [];
  },

  async uploadMessageAttachment(input: {
    messageID: number;
    file: File;
    thumbnailURL?: string | null;
  }): Promise<ChatMessageAttachment> {
    const buildFormData = (messageKey: "MessageID" | "messageId") => {
      const formData = new FormData();
      formData.append("file", input.file);
      formData.append(messageKey, String(input.messageID));
      if (input.thumbnailURL) {
        formData.append("ThumbnailURL", input.thumbnailURL);
      }
      return formData;
    };

    const uploadWithKey = async (messageKey: "MessageID" | "messageId") => {
      const data = await requestEnvelope<ChatMessageAttachment>(
        {
          method: "POST",
          url: "/MessageAttachments/upload",
          data: buildFormData(messageKey),
        },
        "Không thể tải tệp lên.",
      );

      return normalizeAttachment({ ...data, uploadStatus: "uploaded" });
    };

    try {
      return await uploadWithKey("MessageID");
    } catch (error) {
      if (error instanceof ChatApiError && error.status === 400) {
        return await uploadWithKey("messageId");
      }
      throw error;
    }
  },

  async createMessageAttachment(
    payload: CreateMessageAttachmentPayload,
  ): Promise<ChatMessageAttachment> {
    return await requestEnvelope<ChatMessageAttachment>(
      {
        method: "POST",
        url: "/MessageAttachments/create",
        data: {
          messageID: payload.messageID,
          fileURL: payload.fileURL ?? payload.fileUrl,
          fileName: payload.fileName,
          mimeType: payload.mimeType,
          fileSizeBytes: payload.fileSizeBytes,
          thumbnailURL: payload.thumbnailURL ?? payload.thumbnailUrl,
        },
      },
      "Không thể tạo tệp đính kèm.",
    );
  },

  async updateMessageAttachment(
    attachmentID: number,
    payload: UpdateMessageAttachmentPayload,
  ): Promise<ChatMessageAttachment> {
    return await requestEnvelope<ChatMessageAttachment>(
      {
        method: "PUT",
        url: `/MessageAttachments/update/${attachmentID}`,
        data: payload,
      },
      "Không thể cập nhật tệp đính kèm.",
    );
  },
};
