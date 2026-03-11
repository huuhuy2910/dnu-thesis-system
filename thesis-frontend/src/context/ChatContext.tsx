import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchData, getAvatarUrl } from "../api/fetchData";
import { chatApi, ChatApiError } from "../api/chatApi";
import { useAuth } from "../hooks/useAuth";
import { chatRealtime } from "../services/chatRealtime";
import type { ApiResponse } from "../types/api";
import type {
  ChatConversation,
  ChatConversationMember,
  ChatMessage,
  ChatMessageAttachment,
  ChatMessageReaction,
  ChatMessageReadReceipt,
} from "../types/chat";
import type { LecturerProfile } from "../types/lecturer-profile";
import type { StudentProfile } from "../types/studentProfile";
import { useToast } from "./useToast";

type ChatConversationView = ChatConversation & {
  unreadCount?: number;
  members?: ChatConversationMember[];
};

type UploadCandidate = {
  file: File;
  localPreviewURL: string;
};

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "svg",
  "heic",
  "heif",
]);

const FILE_MIME_BY_EXTENSION: Record<string, string> = {
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

function extractFileExtension(value?: string | null): string {
  if (!value) return "";
  const cleaned = String(value).split("?")[0].split("#")[0];
  const parts = cleaned.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

function resolveFileMimeType(file: File): string {
  const mime = String(file.type || "")
    .trim()
    .toLowerCase();
  if (mime) return mime;

  const extension = extractFileExtension(file.name);
  return FILE_MIME_BY_EXTENSION[extension] || "application/octet-stream";
}

function isImageFile(file: File): boolean {
  const mime = resolveFileMimeType(file);
  if (mime.startsWith("image/")) {
    return true;
  }
  return IMAGE_EXTENSIONS.has(extractFileExtension(file.name));
}

export type ChatContextValue = {
  enabled: boolean;
  conversations: ChatConversationView[];
  openConversationIds: number[];
  activeConversationId: number | null;
  activeMessages: ChatMessage[];
  unreadTotal: number;
  loadingConversations: boolean;
  loadingMessages: boolean;
  getConversationMessages: (conversationId: number) => ChatMessage[];
  selectConversation: (conversationId: number) => Promise<void>;
  closeConversationPopup: (conversationId: number) => Promise<void>;
  refreshConversations: () => Promise<void>;
  sendMessage: (
    conversationId: number,
    content?: string,
    files?: File[],
  ) => Promise<void>;
  retryAttachmentUpload: (
    conversationId: number,
    messageId: number,
    attachmentId: number,
  ) => Promise<void>;
  toggleReaction: (
    conversationId: number,
    messageId: number,
    reactionType: string,
    reactedByMe: boolean,
  ) => Promise<void>;
  markConversationRead: (
    conversationId: number,
    messageId?: number,
  ) => Promise<void>;
  getReadState: (
    message: ChatMessage,
    conversationId: number,
  ) => {
    readBy: ChatConversationMember[];
    unreadBy: ChatConversationMember[];
  };
  reactionIconMap: Record<string, string>;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const REACTION_ICON_MAP: Record<string, string> = {
  "1": "👍",
  "2": "❤️",
  "3": "😂",
  "4": "😮",
  "5": "😢",
  "6": "😡",
};

function sortMessagesByTime(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (a, b) =>
      new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime(),
  );
}

function upsertMessage(
  messages: ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  const index = messages.findIndex(
    (item) => Number(item.messageID) === Number(message.messageID),
  );

  if (index < 0) return sortMessagesByTime([...messages, message]);

  const next = [...messages];
  next[index] = {
    ...next[index],
    ...message,
    attachments: message.attachments || next[index].attachments || [],
    reactions: message.reactions || next[index].reactions || [],
    readReceipts: message.readReceipts || next[index].readReceipts || [],
  };
  return sortMessagesByTime(next);
}

function mergeMessagesById(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  return incoming.reduce((acc, item) => upsertMessage(acc, item), current);
}

function isPersistedMessageId(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return false;
  }
  if (!Number.isInteger(value)) {
    return false;
  }
  return value > 0 && value <= 2147483647;
}

function mergeReaction(
  message: ChatMessage,
  reaction: ChatMessageReaction,
): ChatMessage {
  const current = Array.isArray(message.reactions) ? message.reactions : [];
  const index = current.findIndex(
    (item) => item.reactionID === reaction.reactionID,
  );

  if (index < 0) {
    return { ...message, reactions: [...current, reaction] };
  }

  const next = [...current];
  next[index] = { ...next[index], ...reaction };
  return { ...message, reactions: next };
}

function isSameReactionIdentity(
  left: ChatMessageReaction,
  right: ChatMessageReaction,
): boolean {
  return (
    Number(left.messageID) === Number(right.messageID) &&
    String(left.userCode || "") === String(right.userCode || "") &&
    String(left.reactionType || "") === String(right.reactionType || "")
  );
}

function mergeReactionWithTempReconcile(
  message: ChatMessage,
  reaction: ChatMessageReaction,
): ChatMessage {
  const current = Array.isArray(message.reactions) ? message.reactions : [];

  const byIdIndex = current.findIndex(
    (item) => Number(item.reactionID) === Number(reaction.reactionID),
  );
  if (byIdIndex >= 0) {
    const next = [...current];
    next[byIdIndex] = { ...next[byIdIndex], ...reaction };
    return { ...message, reactions: next };
  }

  const tempIndex = current.findIndex(
    (item) =>
      Number(item.reactionID) <= 0 && isSameReactionIdentity(item, reaction),
  );
  if (tempIndex >= 0) {
    const next = [...current];
    next[tempIndex] = { ...next[tempIndex], ...reaction };
    return { ...message, reactions: next };
  }

  return { ...message, reactions: [...current, reaction] };
}

function mergeServerReactionList(
  message: ChatMessage,
  serverReactions: ChatMessageReaction[],
): ChatMessage {
  const current = Array.isArray(message.reactions) ? message.reactions : [];
  const serverById = new Map<number, ChatMessageReaction>();
  serverReactions.forEach((reaction) => {
    const id = Number(reaction.reactionID);
    if (id > 0) {
      serverById.set(id, reaction);
    }
  });

  const remainingTemps = current.filter((localReaction) => {
    if (Number(localReaction.reactionID) > 0) {
      return false;
    }
    return !serverReactions.some((serverReaction) =>
      isSameReactionIdentity(localReaction, serverReaction),
    );
  });

  return {
    ...message,
    reactions: [...Array.from(serverById.values()), ...remainingTemps],
  };
}

function removeReaction(message: ChatMessage, reactionID: number): ChatMessage {
  const current = Array.isArray(message.reactions) ? message.reactions : [];
  return {
    ...message,
    reactions: current.filter(
      (item) => Number(item.reactionID) !== Number(reactionID),
    ),
  };
}

function mergeReceipt(
  message: ChatMessage,
  receipt: ChatMessageReadReceipt,
): ChatMessage {
  const current = Array.isArray(message.readReceipts)
    ? message.readReceipts
    : [];
  const index = current.findIndex(
    (item) =>
      Number(item.receiptID) === Number(receipt.receiptID) ||
      (item.userCode && receipt.userCode && item.userCode === receipt.userCode),
  );

  if (index < 0) {
    const next = [...current, receipt];
    return { ...message, readReceipts: next, receiptCount: next.length };
  }

  const next = [...current];
  next[index] = { ...next[index], ...receipt };
  return { ...message, readReceipts: next, receiptCount: next.length };
}

function replaceAttachmentById(
  attachments: ChatMessageAttachment[],
  attachmentId: number,
  updater: (current: ChatMessageAttachment) => ChatMessageAttachment,
): ChatMessageAttachment[] {
  return attachments.map((item) =>
    Number(item.attachmentID) === Number(attachmentId) ? updater(item) : item,
  );
}

function upsertAttachment(
  attachments: ChatMessageAttachment[],
  attachment: ChatMessageAttachment,
): ChatMessageAttachment[] {
  const index = attachments.findIndex(
    (item) => Number(item.attachmentID) === Number(attachment.attachmentID),
  );

  if (index < 0) {
    return [...attachments, attachment];
  }

  const next = [...attachments];
  next[index] = { ...next[index], ...attachment };
  return next;
}

function removeAttachmentById(
  attachments: ChatMessageAttachment[],
  attachmentId: number,
): ChatMessageAttachment[] {
  return attachments.filter(
    (item) => Number(item.attachmentID) !== Number(attachmentId),
  );
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useAuth();
  const { addToast } = useToast();

  const [conversations, setConversations] = useState<ChatConversationView[]>(
    [],
  );
  const [openConversationIds, setOpenConversationIds] = useState<number[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [membersByConversation, setMembersByConversation] = useState<
    Record<string, ChatConversationMember[]>
  >({});
  const [unreadByConversation, setUnreadByConversation] = useState<
    Record<string, number>
  >({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const enabled =
    !!auth.user &&
    !!auth.isAuthenticated &&
    ["STUDENT", "LECTURER"].includes(
      String(auth.user.role || "").toUpperCase(),
    );

  const currentUserCode = auth.user?.userCode || "";

  const handleChatError = useCallback(
    (error: unknown, fallbackMessage: string) => {
      if (error instanceof ChatApiError) {
        addToast(error.message, "error");
        return;
      }

      addToast(fallbackMessage, "error");
    },
    [addToast],
  );

  const hydrateMemberProfiles = useCallback(
    async (members: ChatConversationMember[]) => {
      const unresolved = members.filter(
        (member) => !member.avatarURL || !member.fullName || !member.userRole,
      );

      if (!unresolved.length) return members;

      const updated = [...members];
      await Promise.all(
        unresolved.map(async (member) => {
          if (!member.userCode) return;

          const userRes = await fetchData<
            ApiResponse<Array<{ role?: string; fullName?: string }>>
          >(
            `/Users/get-list?UserCode=${encodeURIComponent(member.userCode)}`,
          ).catch(() => null);

          const user = userRes?.data?.[0];
          const role = String(user?.role || "").toUpperCase();

          let avatarPath: string | undefined;
          let fullName = user?.fullName || member.userCode;

          if (role === "STUDENT") {
            const studentRes = await fetchData<ApiResponse<StudentProfile[]>>(
              `/StudentProfiles/get-list?UserCode=${encodeURIComponent(member.userCode)}`,
            ).catch(() => null);
            const student = studentRes?.data?.[0];
            avatarPath = student?.studentImage;
            fullName = student?.fullName || fullName;
          } else if (role === "LECTURER") {
            const lecturerRes = await fetchData<ApiResponse<LecturerProfile[]>>(
              `/LecturerProfiles/get-list?UserCode=${encodeURIComponent(member.userCode)}`,
            ).catch(() => null);
            const lecturer = lecturerRes?.data?.[0];
            avatarPath = lecturer?.profileImage;
            fullName = lecturer?.fullName || fullName;
          }

          const targetIndex = updated.findIndex(
            (item) => item.userCode === member.userCode,
          );
          if (targetIndex >= 0) {
            updated[targetIndex] = {
              ...updated[targetIndex],
              userRole: role || updated[targetIndex].userRole,
              fullName,
              avatarURL: avatarPath
                ? getAvatarUrl(avatarPath)
                : updated[targetIndex].avatarURL,
            };
          }
        }),
      );

      return updated;
    },
    [],
  );

  const loadMembers = useCallback(
    async (conversationId: number) => {
      const key = String(conversationId);
      try {
        const members = await chatApi.listConversationMembers(conversationId);
        const hydrated = await hydrateMemberProfiles(members);
        setMembersByConversation((prev) => ({ ...prev, [key]: hydrated }));
        setConversations((prev) =>
          prev.map((item) =>
            Number(item.conversationID) === Number(conversationId)
              ? { ...item, members: hydrated }
              : item,
          ),
        );
      } catch {
        // ignore members fetch errors, UI still works
      }
    },
    [hydrateMemberProfiles],
  );

  const loadMessageMeta = useCallback(
    async (conversationId: number, messages: ChatMessage[]) => {
      const withMeta = await Promise.all(
        messages.map(async (message) => {
          const [attachments, receipts, reactions] = await Promise.all([
            chatApi.listMessageAttachments(message.messageID).catch(() => []),
            chatApi
              .listMessageReadReceipts({
                page: 1,
                pageSize: 200,
                messageID: message.messageID,
              })
              .catch(() => []),
            chatApi
              .listReactions({
                page: 1,
                pageSize: 200,
                messageID: message.messageID,
              })
              .catch(() => []),
          ]);

          return {
            ...message,
            attachments,
            reactions,
            readReceipts: receipts,
            receiptCount: receipts.length,
          };
        }),
      );

      setMessagesByConversation((prev) => {
        const key = String(conversationId);
        const current = prev[key] || [];
        return {
          ...prev,
          [key]: mergeMessagesById(current, withMeta),
        };
      });
    },
    [],
  );

  const refreshConversations = useCallback(async () => {
    if (!enabled || !currentUserCode) {
      setConversations([]);
      return;
    }

    setLoadingConversations(true);
    try {
      const memberships = await chatApi.listConversationMembersByUser(
        currentUserCode,
        1,
        200,
      );

      const activeMemberships = memberships.filter(
        (item) =>
          item.userCode === currentUserCode &&
          (!item.leftAt || String(item.leftAt).trim() === ""),
      );

      const conversationCodes = Array.from(
        new Set(
          activeMemberships
            .map((item) => String(item.conversationCode || "").trim())
            .filter(Boolean),
        ),
      );

      if (!conversationCodes.length) {
        setConversations([]);
        setUnreadByConversation({});
        return;
      }

      const listByCode = await Promise.all(
        conversationCodes.map((conversationCode) =>
          chatApi.listConversations({
            page: 1,
            pageSize: 10,
            conversationCode,
            isArchived: false,
          }),
        ),
      );

      const merged = listByCode
        .flat()
        .filter((item) => !item.isArchived)
        .reduce<ChatConversationView[]>((acc, item) => {
          if (
            !acc.some(
              (existing) =>
                Number(existing.conversationID) === Number(item.conversationID),
            )
          ) {
            acc.push(item);
          }
          return acc;
        }, []);

      const memberEntries = await Promise.all(
        merged.map(async (conversation) => {
          const rawMembers = await chatApi
            .listConversationMembers(conversation.conversationID)
            .catch(() => []);
          const hydratedMembers = await hydrateMemberProfiles(rawMembers);
          return [
            String(conversation.conversationID),
            hydratedMembers,
          ] as const;
        }),
      );

      const membersMap = memberEntries.reduce<
        Record<string, ChatConversationMember[]>
      >((acc, [conversationId, members]) => {
        acc[conversationId] = members;
        return acc;
      }, {});

      setConversations(
        merged.map((conversation) => ({
          ...conversation,
          members: membersMap[String(conversation.conversationID)] || [],
        })),
      );

      setMembersByConversation((prev) => ({ ...prev, ...membersMap }));

      const unreadMap = activeMemberships.reduce<Record<string, number>>(
        (acc, member) => {
          const key = String(member.conversationID);
          acc[key] = Number(member.unreadCount || 0);
          return acc;
        },
        {},
      );
      setUnreadByConversation(unreadMap);
    } catch (error) {
      handleChatError(error, "Không thể tải danh sách hội thoại.");
    } finally {
      setLoadingConversations(false);
    }
  }, [currentUserCode, enabled, handleChatError, hydrateMemberProfiles]);

  const loadMessages = useCallback(
    async (conversationId: number) => {
      if (!enabled) return;

      const key = String(conversationId);
      setLoadingMessages(true);
      try {
        const data = await chatApi.listMessages({
          page: 1,
          pageSize: 200,
          conversationID: conversationId,
          isDeleted: false,
        });

        const sortedData = sortMessagesByTime(data).map((item) => ({
          ...item,
          attachments: item.attachments || [],
          reactions: item.reactions || [],
          readReceipts: item.readReceipts || [],
          receiptCount: item.receiptCount || 0,
        }));

        setMessagesByConversation((prev) => ({
          ...prev,
          [key]: mergeMessagesById(prev[key] || [], sortedData),
        }));

        await Promise.all([
          loadMessageMeta(conversationId, sortedData),
          loadMembers(conversationId),
        ]);
      } catch (error) {
        handleChatError(error, "Không thể tải tin nhắn hội thoại.");
      } finally {
        setLoadingMessages(false);
      }
    },
    [enabled, handleChatError, loadMembers, loadMessageMeta],
  );

  const markConversationRead = useCallback(
    async (conversationId: number, messageId?: number) => {
      if (!enabled || !currentUserCode) return;

      const key = String(conversationId);
      setUnreadByConversation((prev) => ({ ...prev, [key]: 0 }));

      const currentMessages = messagesByConversation[key] || [];
      const requestedMessageId =
        typeof messageId === "number" ? Number(messageId) : NaN;
      const latestPersistedMessageId = [...currentMessages]
        .reverse()
        .map((item) => Number(item.messageID))
        .find((id) => isPersistedMessageId(id));
      const targetMessageId = isPersistedMessageId(requestedMessageId)
        ? requestedMessageId
        : latestPersistedMessageId;

      if (!targetMessageId) return;

      try {
        const receipt = await chatApi.createMessageReadReceipt({
          messageID: targetMessageId,
          userCode: currentUserCode,
          readAt: new Date().toISOString(),
        });

        setMessagesByConversation((prev) => {
          const current = prev[key] || [];
          return {
            ...prev,
            [key]: current.map((msg) =>
              Number(msg.messageID) === Number(targetMessageId)
                ? mergeReceipt(msg, receipt)
                : msg,
            ),
          };
        });
      } catch (error) {
        handleChatError(error, "Không thể cập nhật trạng thái đã đọc.");
      }
    },
    [currentUserCode, enabled, handleChatError, messagesByConversation],
  );

  const closeConversationPopup = useCallback(
    async (conversationId: number) => {
      setOpenConversationIds((prev) =>
        prev.filter((item) => Number(item) !== Number(conversationId)),
      );

      if (Number(activeConversationId) === Number(conversationId)) {
        const nextId = openConversationIds.find(
          (item) => Number(item) !== Number(conversationId),
        );
        setActiveConversationId(nextId ?? null);
      }

      const conversation = conversations.find(
        (item) => Number(item.conversationID) === Number(conversationId),
      );
      if (conversation?.conversationCode) {
        try {
          await chatRealtime.leaveConversation(conversation.conversationCode);
        } catch {
          // ignore leave error
        }
      }

      try {
        await chatRealtime.leaveConversationById(conversationId);
      } catch {
        // ignore leave-by-id error
      }
    },
    [activeConversationId, conversations, openConversationIds],
  );

  const selectConversation = useCallback(
    async (conversationId: number) => {
      setActiveConversationId(conversationId);
      setOpenConversationIds((prev) => {
        const already = prev.includes(conversationId);
        const merged = already ? prev : [...prev, conversationId];
        return merged.slice(-2);
      });

      await loadMessages(conversationId);

      const selectedConversation = conversations.find(
        (item) => Number(item.conversationID) === Number(conversationId),
      );

      if (selectedConversation?.conversationCode) {
        try {
          await chatRealtime.joinConversation(
            selectedConversation.conversationCode,
            conversationId,
          );
        } catch {
          try {
            await chatRealtime.joinConversationById(conversationId);
          } catch {
            // ignore join fallback error
          }
        }
      } else {
        try {
          await chatRealtime.joinConversationById(conversationId);
        } catch {
          // ignore join-by-id error
        }
      }
      await markConversationRead(conversationId);
    },
    [conversations, loadMessages, markConversationRead],
  );

  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadCandidate[]> => {
      return files.map((file) => ({
        file,
        localPreviewURL: URL.createObjectURL(file),
      }));
    },
    [],
  );

  const retryAttachmentUpload = useCallback(
    async (conversationId: number, messageId: number, attachmentId: number) => {
      const key = String(conversationId);
      const currentMessages = messagesByConversation[key] || [];
      const targetMessage = currentMessages.find(
        (item) => Number(item.messageID) === Number(messageId),
      );
      if (!targetMessage) return;

      const targetAttachment = (targetMessage.attachments || []).find(
        (item) => Number(item.attachmentID) === Number(attachmentId),
      );
      if (!targetAttachment?.localFile) return;

      setMessagesByConversation((prev) => {
        const list = prev[key] || [];
        return {
          ...prev,
          [key]: list.map((item) => {
            if (Number(item.messageID) !== Number(messageId)) return item;
            return {
              ...item,
              attachments: replaceAttachmentById(
                item.attachments || [],
                attachmentId,
                (attachment) => ({
                  ...attachment,
                  uploadStatus: "uploading",
                  uploadError: null,
                }),
              ),
            };
          }),
        };
      });

      try {
        const uploaded = await chatApi.uploadMessageAttachment({
          messageID: messageId,
          file: targetAttachment.localFile,
        });

        setMessagesByConversation((prev) => {
          const list = prev[key] || [];
          return {
            ...prev,
            [key]: list.map((item) => {
              if (Number(item.messageID) !== Number(messageId)) return item;

              return {
                ...item,
                attachments: replaceAttachmentById(
                  item.attachments || [],
                  attachmentId,
                  (attachment) => {
                    if (attachment.localPreviewURL) {
                      URL.revokeObjectURL(attachment.localPreviewURL);
                    }

                    return {
                      ...uploaded,
                      uploadStatus: "uploaded",
                      uploadError: null,
                    };
                  },
                ),
              };
            }),
          };
        });
      } catch (error) {
        const errorMessage =
          error instanceof ChatApiError ? error.message : "Upload tệp thất bại";

        setMessagesByConversation((prev) => {
          const list = prev[key] || [];
          return {
            ...prev,
            [key]: list.map((item) => {
              if (Number(item.messageID) !== Number(messageId)) return item;
              return {
                ...item,
                attachments: replaceAttachmentById(
                  item.attachments || [],
                  attachmentId,
                  (attachment) => ({
                    ...attachment,
                    uploadStatus: "failed",
                    uploadError: errorMessage,
                  }),
                ),
              };
            }),
          };
        });
      }
    },
    [messagesByConversation],
  );

  const sendMessage = useCallback(
    async (conversationId: number, content = "", files: File[] = []) => {
      const trimmed = content.trim();
      const hasFiles = files.length > 0;
      if ((!trimmed && !hasFiles) || !enabled || !currentUserCode) return;

      const uploadCandidates = hasFiles ? await uploadFiles(files) : [];
      const conversationKey = String(conversationId);
      const tempId = -Date.now();

      const messageType = hasFiles
        ? uploadCandidates.every((item) => isImageFile(item.file))
          ? "IMAGE"
          : "FILE"
        : "TEXT";

      const optimistic: ChatMessage = {
        messageID: tempId,
        conversationID: conversationId,
        senderUserCode: currentUserCode,
        content: trimmed,
        messageType,
        isDeleted: false,
        sentAt: new Date().toISOString(),
        attachments: uploadCandidates.map((item, index) => ({
          attachmentID: -(index + 1),
          messageID: tempId,
          fileURL: item.localPreviewURL,
          fileUrl: item.localPreviewURL,
          fileName: item.file.name,
          mimeType: resolveFileMimeType(item.file),
          fileSizeBytes: item.file.size,
          uploadStatus: "uploading",
          uploadError: null,
          localPreviewURL: item.localPreviewURL,
          localFile: item.file,
        })),
        reactions: [],
        readReceipts: [],
        receiptCount: 0,
        isOptimistic: true,
      };

      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationKey]: [...(prev[conversationKey] || []), optimistic],
      }));

      try {
        const savedMessage = await chatApi.sendMessage({
          conversationID: conversationId,
          senderUserCode: currentUserCode,
          content: trimmed,
          messageType,
        });

        const persistedMessage: ChatMessage = {
          ...savedMessage,
          attachments: uploadCandidates.map((item, index) => ({
            attachmentID: -(index + 1),
            messageID: savedMessage.messageID,
            fileURL: item.localPreviewURL,
            fileUrl: item.localPreviewURL,
            fileName: item.file.name,
            mimeType: resolveFileMimeType(item.file),
            fileSizeBytes: item.file.size,
            uploadStatus: "uploading",
            uploadError: null,
            localPreviewURL: item.localPreviewURL,
            localFile: item.file,
          })),
          reactions: [],
          readReceipts: [],
          receiptCount: 0,
        };

        setMessagesByConversation((prev) => {
          const current = prev[conversationKey] || [];
          const withoutTemp = current.filter(
            (item) => Number(item.messageID) !== Number(tempId),
          );
          return {
            ...prev,
            [conversationKey]: upsertMessage(withoutTemp, persistedMessage),
          };
        });

        await Promise.all(
          uploadCandidates.map(async (candidate, index) => {
            const tempAttachmentId = -(index + 1);

            try {
              const uploadedAttachment = await chatApi.uploadMessageAttachment({
                messageID: savedMessage.messageID,
                file: candidate.file,
              });

              setMessagesByConversation((prev) => {
                const current = prev[conversationKey] || [];
                return {
                  ...prev,
                  [conversationKey]: current.map((message) => {
                    if (
                      Number(message.messageID) !==
                      Number(savedMessage.messageID)
                    ) {
                      return message;
                    }

                    return {
                      ...message,
                      attachments: replaceAttachmentById(
                        message.attachments || [],
                        tempAttachmentId,
                        (attachment) => {
                          if (attachment.localPreviewURL) {
                            URL.revokeObjectURL(attachment.localPreviewURL);
                          }

                          return {
                            ...uploadedAttachment,
                            uploadStatus: "uploaded",
                            uploadError: null,
                          };
                        },
                      ),
                    };
                  }),
                };
              });
            } catch (uploadError) {
              const errorMessage =
                uploadError instanceof ChatApiError
                  ? uploadError.message
                  : "Upload tệp thất bại";

              setMessagesByConversation((prev) => {
                const current = prev[conversationKey] || [];
                return {
                  ...prev,
                  [conversationKey]: current.map((message) => {
                    if (
                      Number(message.messageID) !==
                      Number(savedMessage.messageID)
                    ) {
                      return message;
                    }

                    return {
                      ...message,
                      attachments: replaceAttachmentById(
                        message.attachments || [],
                        tempAttachmentId,
                        (attachment) => ({
                          ...attachment,
                          uploadStatus: "failed",
                          uploadError: errorMessage,
                        }),
                      ),
                    };
                  }),
                };
              });
            }
          }),
        );

        await refreshConversations();
      } catch (error) {
        uploadCandidates.forEach((item) => {
          URL.revokeObjectURL(item.localPreviewURL);
        });

        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationKey]: (prev[conversationKey] || []).filter(
            (item) => Number(item.messageID) !== Number(tempId),
          ),
        }));
        handleChatError(error, "Không thể gửi tin nhắn.");
      }
    },
    [
      currentUserCode,
      enabled,
      handleChatError,
      refreshConversations,
      uploadFiles,
    ],
  );

  const toggleReaction = useCallback(
    async (
      conversationId: number,
      messageId: number,
      reactionType: string,
      reactedByMe: boolean,
    ) => {
      if (!enabled || !currentUserCode) return;

      const key = String(conversationId);
      const before = messagesByConversation[key] || [];
      const target = before.find(
        (item) => Number(item.messageID) === Number(messageId),
      );
      if (!target) return;

      const currentReactions = Array.isArray(target.reactions)
        ? target.reactions
        : [];
      const myReaction = currentReactions.find(
        (item) => item.userCode === currentUserCode,
      );
      const optimisticReactionId = -(
        Date.now() + Math.floor(Math.random() * 1000)
      );

      setMessagesByConversation((prev) => ({
        ...prev,
        [key]: before.map((msg) => {
          if (Number(msg.messageID) !== Number(messageId)) return msg;

          if (myReaction && reactedByMe) {
            return removeReaction(msg, myReaction.reactionID);
          }

          if (myReaction && myReaction.reactionType !== reactionType) {
            return mergeReaction(msg, { ...myReaction, reactionType });
          }

          return mergeReaction(msg, {
            reactionID: optimisticReactionId,
            messageID: messageId,
            userCode: currentUserCode,
            reactionType,
            reactedAt: new Date().toISOString(),
          });
        }),
      }));

      try {
        if (myReaction && reactedByMe) {
          if (Number(myReaction.reactionID) > 0) {
            await chatApi.deleteReaction(myReaction.reactionID);
          }
        } else if (myReaction && myReaction.reactionType !== reactionType) {
          await chatApi.updateReaction(myReaction.reactionID, { reactionType });
        } else if (!myReaction) {
          const createdReaction = await chatApi.addReaction({
            messageID: messageId,
            reactionType,
          });

          setMessagesByConversation((prev) => {
            const current = prev[key] || [];
            return {
              ...prev,
              [key]: current.map((msg) => {
                if (Number(msg.messageID) !== Number(messageId)) return msg;
                return mergeReactionWithTempReconcile(msg, createdReaction);
              }),
            };
          });
        }
      } catch (error) {
        if (
          myReaction &&
          reactedByMe &&
          myReaction.reactionID > 0 &&
          error instanceof ChatApiError &&
          error.status === 404
        ) {
          const latestReactions = await chatApi
            .listReactions({
              messageID: messageId,
              page: 1,
              pageSize: 200,
            })
            .catch(() => null);

          if (Array.isArray(latestReactions)) {
            setMessagesByConversation((prev) => {
              const current = prev[key] || [];
              return {
                ...prev,
                [key]: current.map((msg) => {
                  if (Number(msg.messageID) !== Number(messageId)) return msg;
                  return mergeServerReactionList(msg, latestReactions);
                }),
              };
            });
            return;
          }
        }

        setMessagesByConversation((prev) => ({ ...prev, [key]: before }));
        handleChatError(error, "Không thể cập nhật biểu cảm.");
      }
    },
    [currentUserCode, enabled, handleChatError, messagesByConversation],
  );

  const getReadState = useCallback(
    (message: ChatMessage, conversationId: number) => {
      const members = membersByConversation[String(conversationId)] || [];
      const readSet = new Set(
        (message.readReceipts || [])
          .map((item) => item.userCode)
          .filter(Boolean) as string[],
      );

      const readBy = members.filter((member) =>
        member.userCode ? readSet.has(member.userCode) : false,
      );
      const unreadBy = members.filter((member) =>
        member.userCode ? !readSet.has(member.userCode) : true,
      );

      return { readBy, unreadBy };
    },
    [membersByConversation],
  );

  useEffect(() => {
    if (!enabled) {
      setConversations([]);
      setOpenConversationIds([]);
      setActiveConversationId(null);
      setMessagesByConversation({});
      setMembersByConversation({});
      setUnreadByConversation({});
      void chatRealtime.stop();
      return;
    }

    const setup = async () => {
      try {
        await chatRealtime.start();
      } catch {
        addToast("Không thể kết nối realtime chat.", "warning");
      }

      await refreshConversations();
    };

    void setup();

    return () => {
      void chatRealtime.stop();
    };
  }, [addToast, enabled, refreshConversations]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    const unsubscribe = chatRealtime.subscribe((event) => {
      if (!active) return;

      const eventConversationId = event.conversationID;
      const eventMessageId = event.messageID;
      const payload = (event.payload || {}) as Record<string, unknown>;

      if (eventConversationId) {
        const key = String(eventConversationId);
        if (!openConversationIds.includes(eventConversationId)) {
          if (event.type === "message.created") {
            setUnreadByConversation((prev) => ({
              ...prev,
              [key]: (prev[key] || 0) + 1,
            }));
          }
        }
      }

      if (event.type === "message.created" && eventConversationId && payload) {
        const incoming: ChatMessage = {
          messageID: Number(payload.messageID || 0),
          conversationID: Number(payload.conversationID || eventConversationId),
          senderUserCode: String(payload.senderUserCode || ""),
          content: String(payload.content || ""),
          messageType: String(payload.messageType || "TEXT"),
          isDeleted: Boolean(payload.isDeleted),
          sentAt: String(payload.sentAt || new Date().toISOString()),
          attachments: [],
          reactions: [],
          readReceipts: [],
          receiptCount: 0,
        };

        setMessagesByConversation((prev) => ({
          ...prev,
          [String(eventConversationId)]: upsertMessage(
            prev[String(eventConversationId)] || [],
            incoming,
          ),
        }));

        void loadMessageMeta(eventConversationId, [incoming]);
      }

      if (
        event.type === "message.updated" &&
        eventConversationId &&
        eventMessageId
      ) {
        setMessagesByConversation((prev) => {
          const current = prev[String(eventConversationId)] || [];
          return {
            ...prev,
            [String(eventConversationId)]: current.map((msg) =>
              Number(msg.messageID) === Number(eventMessageId)
                ? {
                    ...msg,
                    content: String(payload.content || msg.content || ""),
                    editedAt: String(
                      payload.editedAt || new Date().toISOString(),
                    ),
                  }
                : msg,
            ),
          };
        });
      }

      if (
        event.type === "message.deleted" &&
        eventConversationId &&
        eventMessageId
      ) {
        setMessagesByConversation((prev) => {
          const current = prev[String(eventConversationId)] || [];
          return {
            ...prev,
            [String(eventConversationId)]: current.map((msg) =>
              Number(msg.messageID) === Number(eventMessageId)
                ? { ...msg, isDeleted: true, content: "Tin nhắn đã bị xóa" }
                : msg,
            ),
          };
        });
      }

      if (
        [
          "reaction.created",
          "reaction.updated",
          "reaction.deleted",
          "message.reaction.created",
          "message.reaction.updated",
          "message.reaction.deleted",
        ].includes(event.type) &&
        eventMessageId
      ) {
        const reactionID = Number(
          payload.reactionID ?? payload.reactionId ?? payload.ReactionID ?? 0,
        );
        const reactionPayload: ChatMessageReaction = {
          reactionID,
          messageID: eventMessageId,
          userCode: String(payload.userCode ?? payload.UserCode ?? ""),
          reactionType: String(
            payload.reactionType ?? payload.ReactionType ?? "",
          ),
          reactedAt: String(
            payload.reactedAt ?? payload.ReactedAt ?? new Date().toISOString(),
          ),
          displayName: String(
            payload.displayName ?? payload.fullName ?? payload.userName ?? "",
          ),
          avatarUrl: String(
            payload.avatarUrl ??
              payload.avatarURL ??
              payload.profileImage ??
              "",
          ),
        };

        setMessagesByConversation((prev) => {
          const targetConversationIds = eventConversationId
            ? [Number(eventConversationId)]
            : Object.keys(prev)
                .map((id) => Number(id))
                .filter((conversationId) => {
                  const messages = prev[String(conversationId)] || [];
                  return messages.some(
                    (msg) => Number(msg.messageID) === Number(eventMessageId),
                  );
                });

          if (!targetConversationIds.length) {
            return prev;
          }

          const nextState = { ...prev };

          targetConversationIds.forEach((conversationId) => {
            const key = String(conversationId);
            const current = prev[key] || [];
            nextState[key] = current.map((msg) => {
              if (Number(msg.messageID) !== Number(eventMessageId)) return msg;
              if (
                event.type === "reaction.deleted" ||
                event.type === "message.reaction.deleted"
              ) {
                return removeReaction(msg, reactionID);
              }
              return mergeReactionWithTempReconcile(msg, reactionPayload);
            });
          });

          return {
            ...nextState,
          };
        });
      }

      if (
        event.type === "receipt.updated" &&
        eventConversationId &&
        eventMessageId
      ) {
        const receipt: ChatMessageReadReceipt = {
          receiptID: Number(payload.receiptID || Date.now()),
          messageID: eventMessageId,
          userID: Number(payload.userID || 0),
          userCode: String(payload.userCode || ""),
          readAt: String(payload.readAt || new Date().toISOString()),
        };

        setMessagesByConversation((prev) => {
          const key = String(eventConversationId);
          const current = prev[key] || [];
          return {
            ...prev,
            [key]: current.map((msg) =>
              Number(msg.messageID) === Number(eventMessageId)
                ? mergeReceipt(msg, receipt)
                : msg,
            ),
          };
        });
      }

      if (
        (event.type === "message.attachment.created" ||
          event.type === "message.attachment.updated" ||
          event.type === "message.attachment.deleted") &&
        eventConversationId &&
        eventMessageId
      ) {
        const attachmentId = Number(
          payload.attachmentID ?? payload.attachmentId ?? payload.id ?? 0,
        );

        setMessagesByConversation((prev) => {
          const key = String(eventConversationId);
          const current = prev[key] || [];

          return {
            ...prev,
            [key]: current.map((msg) => {
              if (Number(msg.messageID) !== Number(eventMessageId)) return msg;

              const currentAttachments = Array.isArray(msg.attachments)
                ? msg.attachments
                : [];

              if (event.type === "message.attachment.deleted") {
                return {
                  ...msg,
                  attachments: removeAttachmentById(
                    currentAttachments,
                    attachmentId,
                  ),
                };
              }

              const incomingAttachment: ChatMessageAttachment = {
                attachmentID: attachmentId,
                messageID: Number(payload.messageID ?? eventMessageId),
                fileURL: String(payload.fileURL ?? payload.fileUrl ?? ""),
                fileUrl: String(payload.fileUrl ?? payload.fileURL ?? ""),
                fileName:
                  typeof payload.fileName === "string"
                    ? payload.fileName
                    : null,
                mimeType:
                  typeof payload.mimeType === "string"
                    ? payload.mimeType
                    : null,
                fileSizeBytes:
                  typeof payload.fileSizeBytes === "number"
                    ? payload.fileSizeBytes
                    : null,
                thumbnailURL:
                  typeof payload.thumbnailURL === "string"
                    ? payload.thumbnailURL
                    : typeof payload.thumbnailUrl === "string"
                      ? payload.thumbnailUrl
                      : null,
                thumbnailUrl:
                  typeof payload.thumbnailUrl === "string"
                    ? payload.thumbnailUrl
                    : typeof payload.thumbnailURL === "string"
                      ? payload.thumbnailURL
                      : null,
                uploadedAt:
                  typeof payload.uploadedAt === "string"
                    ? payload.uploadedAt
                    : null,
                uploadStatus: "uploaded",
                uploadError: null,
              };

              return {
                ...msg,
                attachments: upsertAttachment(
                  currentAttachments,
                  incomingAttachment,
                ),
              };
            }),
          };
        });
      }

      void refreshConversations();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, loadMessageMeta, openConversationIds, refreshConversations]);

  const activeMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return messagesByConversation[String(activeConversationId)] || [];
  }, [activeConversationId, messagesByConversation]);

  const conversationsWithUnread = useMemo<ChatConversationView[]>(
    () =>
      conversations.map((conversation) => ({
        ...conversation,
        unreadCount:
          unreadByConversation[String(conversation.conversationID)] || 0,
        members:
          membersByConversation[String(conversation.conversationID)] || [],
      })),
    [conversations, unreadByConversation, membersByConversation],
  );

  const unreadTotal = useMemo(
    () =>
      Object.values(unreadByConversation).reduce((sum, item) => sum + item, 0),
    [unreadByConversation],
  );

  const getConversationMessages = useCallback(
    (conversationId: number) =>
      messagesByConversation[String(conversationId)] || [],
    [messagesByConversation],
  );

  const value: ChatContextValue = {
    enabled,
    conversations: conversationsWithUnread,
    openConversationIds,
    activeConversationId,
    activeMessages,
    unreadTotal,
    loadingConversations,
    loadingMessages,
    getConversationMessages,
    selectConversation,
    closeConversationPopup,
    refreshConversations,
    sendMessage,
    retryAttachmentUpload,
    toggleReaction,
    markConversationRead,
    getReadState,
    reactionIconMap: REACTION_ICON_MAP,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export { ChatContext };
