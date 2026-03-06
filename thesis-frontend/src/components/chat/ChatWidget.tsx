import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Image,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  Smile,
  X,
  Eye,
} from "lucide-react";
import { getAvatarUrl } from "../../api/fetchData";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import type {
  ChatConversation,
  ChatConversationMember,
  ChatMessage,
  ChatMessageAttachment,
  ChatMessageReaction,
} from "../../types/chat";

type ChatWidgetTheme = "student" | "lecturer";

interface ChatWidgetProps {
  theme: ChatWidgetTheme;
}

type PickerKind = "file" | "image";

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

const IMAGE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,image/svg+xml,image/heic,image/heif";

const FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.json,.xml";

const themePalette: Record<
  ChatWidgetTheme,
  {
    buttonBg: string;
    buttonColor: string;
    popupBg: string;
    popupBorder: string;
    titleColor: string;
    subtitleColor: string;
    selfMessageBg: string;
    otherMessageBg: string;
  }
> = {
  student: {
    buttonBg: "linear-gradient(135deg, #f37021, #ff8c42)",
    buttonColor: "#ffffff",
    popupBg: "#ffffff",
    popupBorder: "1px solid #e5e7eb",
    titleColor: "#1a2736",
    subtitleColor: "#64748b",
    selfMessageBg: "rgba(243,112,33,0.15)",
    otherMessageBg: "#f8fafc",
  },
  lecturer: {
    buttonBg: "linear-gradient(135deg, rgba(243,112,33,0.95), #e55a0f)",
    buttonColor: "#ffffff",
    popupBg: "linear-gradient(135deg, #ffffff 0%, #fefefe 100%)",
    popupBorder: "1px solid rgba(243,112,33,0.3)",
    titleColor: "#002855",
    subtitleColor: "#475569",
    selfMessageBg: "rgba(243,112,33,0.18)",
    otherMessageBg: "rgba(0,40,85,0.06)",
  },
};

function formatMessageTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || Number.isNaN(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractFileExtension(value?: string | null): string {
  if (!value) return "";
  const cleaned = String(value).split("?")[0].split("#")[0];
  const parts = cleaned.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

function looksLikeImageByName(value?: string | null): boolean {
  const extension = extractFileExtension(value);
  return IMAGE_EXTENSIONS.has(extension);
}

function isImageFile(file: File): boolean {
  if (
    String(file.type || "")
      .toLowerCase()
      .startsWith("image/")
  ) {
    return true;
  }
  return looksLikeImageByName(file.name);
}

function isImageAttachment(attachment: ChatMessageAttachment): boolean {
  const mimeType = String(attachment.mimeType || "").toLowerCase();
  if (mimeType.startsWith("image/")) {
    return true;
  }

  return (
    looksLikeImageByName(attachment.fileName) ||
    looksLikeImageByName(attachment.fileURL) ||
    looksLikeImageByName(attachment.fileUrl) ||
    looksLikeImageByName(attachment.localPreviewURL)
  );
}

function resolveAttachmentUrl(path?: string | null): string {
  if (!path) return "";
  const value = String(path);
  if (
    value.startsWith("blob:") ||
    value.startsWith("data:") ||
    /^https?:\/\//i.test(value)
  ) {
    return value;
  }
  return getAvatarUrl(value);
}

function resolveReactionAvatar(path?: string | null): string {
  if (!path) return "";
  const value = String(path);
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }
  return getAvatarUrl(value);
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ theme }) => {
  const auth = useAuth();
  const {
    enabled,
    conversations,
    openConversationIds,
    activeConversationId,
    unreadTotal,
    loadingConversations,
    loadingMessages,
    getConversationMessages,
    selectConversation,
    closeConversationPopup,
    sendMessage,
    retryAttachmentUpload,
    toggleReaction,
    markConversationRead,
    getReadState,
    reactionIconMap,
  } = useChat();

  const palette = themePalette[theme];

  const [showDropdown, setShowDropdown] = useState(false);
  const [messageTextByConversation, setMessageTextByConversation] = useState<
    Record<number, string>
  >({});
  const [filesByConversation, setFilesByConversation] = useState<
    Record<number, File[]>
  >({});
  const [pickerMessageId, setPickerMessageId] = useState<number | null>(null);
  const [isNearBottomByConversation, setIsNearBottomByConversation] = useState<
    Record<number, boolean>
  >({});
  const [showNewMessageByConversation, setShowNewMessageByConversation] =
    useState<Record<number, boolean>>({});
  const [pickerKindByConversation, setPickerKindByConversation] = useState<
    Record<number, PickerKind>
  >({});
  const [hoveredReactionKey, setHoveredReactionKey] = useState<string | null>(
    null,
  );
  const pickerContainerRef = useRef<HTMLDivElement | null>(null);

  const widgetRef = useRef<HTMLDivElement | null>(null);
  const messageListRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const messageEndRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const scrollToBottom = useCallback(
    (conversationId: number, behavior: ScrollBehavior = "smooth") => {
      const node = messageEndRefs.current[conversationId];
      if (!node) return;
      node.scrollIntoView({ behavior, block: "end" });
    },
    [],
  );

  const topConversations = useMemo(
    () =>
      (
        conversations as Array<
          ChatConversation & {
            unreadCount?: number;
            members?: ChatConversationMember[];
          }
        >
      ).slice(0, 8),
    [conversations],
  );

  const openConversations = useMemo(
    () =>
      (openConversationIds as number[])
        .map((id: number) =>
          (
            conversations as Array<
              ChatConversation & {
                unreadCount?: number;
                members?: ChatConversationMember[];
              }
            >
          ).find(
            (item: ChatConversation) =>
              Number(item.conversationID) === Number(id),
          ),
        )
        .filter(
          (
            item,
          ): item is ChatConversation & {
            unreadCount?: number;
            members?: ChatConversationMember[];
          } => Boolean(item),
        ),
    [conversations, openConversationIds],
  );

  const conversationRenderSignature = useMemo(
    () =>
      openConversations
        .map((conversation) => {
          const messages = getConversationMessages(conversation.conversationID);
          const messageSignature = messages
            .map(
              (message) =>
                `${message.messageID}-${(message.attachments || []).length}`,
            )
            .join("|");
          return `${conversation.conversationID}:${messageSignature}`;
        })
        .join("||"),
    [getConversationMessages, openConversations],
  );

  useEffect(() => {
    (openConversationIds as number[]).forEach((conversationId: number) => {
      const shouldStickBottom =
        isNearBottomByConversation[conversationId] ?? true;
      if (shouldStickBottom) {
        scrollToBottom(conversationId, "smooth");
        setShowNewMessageByConversation((prev) => ({
          ...prev,
          [conversationId]: false,
        }));
      } else {
        setShowNewMessageByConversation((prev) => ({
          ...prev,
          [conversationId]: true,
        }));
      }
    });
  }, [
    conversationRenderSignature,
    isNearBottomByConversation,
    openConversationIds,
    scrollToBottom,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (widgetRef.current && !widgetRef.current.contains(target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // close reactions picker when clicking outside its container
  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!pickerMessageId) return;
      const node = pickerContainerRef.current;
      if (node && !node.contains(event.target as Node)) {
        setPickerMessageId(null);
      }
    };

    if (pickerMessageId) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [pickerMessageId]);

  if (!enabled) return null;

  const handleOpenConversation = async (conversationId: number) => {
    await selectConversation(conversationId);
    setShowDropdown(false);
  };

  const handleSend = async (conversationId: number) => {
    const text = (messageTextByConversation[conversationId] || "").trim();
    const files = filesByConversation[conversationId] || [];
    if (!text && files.length === 0) return;

    await sendMessage(conversationId, text, files);

    setMessageTextByConversation((prev) => ({ ...prev, [conversationId]: "" }));
    setFilesByConversation((prev) => ({ ...prev, [conversationId]: [] }));

    const input = fileInputRefs.current[conversationId];
    if (input) {
      input.value = "";
    }
  };

  const openFilePicker = (conversationId: number, kind: PickerKind) => {
    const input = fileInputRefs.current[conversationId];
    if (!input) return;
    input.accept = kind === "image" ? IMAGE_ACCEPT : FILE_ACCEPT;
    setPickerKindByConversation((prev) => ({
      ...prev,
      [conversationId]: kind,
    }));
    input.value = "";
    input.click();
  };

  const handleFilesChange = (
    conversationId: number,
    files: FileList | null,
  ) => {
    if (!files) return;
    const pickerKind = pickerKindByConversation[conversationId] || "file";
    const pickedFiles = Array.from(files).filter((file) => {
      if (pickerKind === "image") {
        return isImageFile(file);
      }
      return true;
    });
    if (!pickedFiles.length) return;

    setFilesByConversation((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), ...pickedFiles],
    }));
  };

  const removePickedFile = (conversationId: number, index: number) => {
    setFilesByConversation((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).filter(
        (_, i) => i !== index,
      ),
    }));
  };

  return (
    <div
      ref={widgetRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          border: "none",
          background: palette.buttonBg,
          color: palette.buttonColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
          position: "relative",
        }}
        aria-label="Mở tin nhắn"
      >
        <MessageCircle size={20} />
        {unreadTotal > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -2,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: "#ef4444",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 5px",
            }}
          >
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            width: 320,
            maxHeight: 420,
            borderRadius: 14,
            background: palette.popupBg,
            border: palette.popupBorder,
            boxShadow: "0 18px 36px rgba(0,0,0,0.18)",
            overflow: "hidden",
            zIndex: 1300,
            marginTop: 8,
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid rgba(148,163,184,0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: palette.titleColor }}>
                Tin nhắn
              </div>
              <div style={{ fontSize: 12, color: palette.subtitleColor }}>
                Chọn hội thoại để mở (tối đa 2)
              </div>
            </div>
            <button
              onClick={() => setShowDropdown(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: palette.subtitleColor,
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {loadingConversations && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "18px 12px",
                  color: palette.subtitleColor,
                }}
              >
                <Loader2 size={16} className="animate-spin" />
                Đang tải hội thoại...
              </div>
            )}

            {!loadingConversations && topConversations.length === 0 && (
              <div
                style={{
                  padding: "18px 12px",
                  textAlign: "center",
                  color: palette.subtitleColor,
                  fontSize: 13,
                }}
              >
                Chưa có hội thoại nào.
              </div>
            )}

            {!loadingConversations &&
              topConversations.map((conversation) => {
                const conversationTitle =
                  conversation.title?.trim() || conversation.conversationCode;
                const unreadCount = Number(conversation.unreadCount || 0);
                const members = Array.isArray(conversation.members)
                  ? conversation.members
                  : [];
                const targetMember = members.find(
                  (item: ChatConversationMember) =>
                    item.userCode &&
                    auth.user?.userCode &&
                    item.userCode !== auth.user.userCode,
                );

                return (
                  <button
                    key={String(conversation.conversationID)}
                    onClick={() =>
                      handleOpenConversation(conversation.conversationID)
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      borderBottom: "1px solid rgba(148,163,184,0.12)",
                      background: "transparent",
                      padding: "10px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(243,112,33,0.12)",
                        color: "#f37021",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        flexShrink: 0,
                        overflow: "hidden",
                      }}
                    >
                      {targetMember?.avatarURL || conversation.avatarURL ? (
                        <img
                          src={getAvatarUrl(
                            targetMember?.avatarURL || conversation.avatarURL,
                          )}
                          alt={conversationTitle}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span>{conversationTitle.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: palette.titleColor,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {targetMember?.fullName || conversationTitle}
                        </span>
                        {unreadCount > 0 && (
                          <span
                            style={{
                              background: "#ef4444",
                              color: "#fff",
                              borderRadius: 10,
                              minWidth: 18,
                              height: 18,
                              fontSize: 11,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0 5px",
                              flexShrink: 0,
                            }}
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: palette.subtitleColor,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: 3,
                        }}
                      >
                        {conversation.lastMessagePreview || "Chưa có tin nhắn"}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {openConversations.map((conversation, index) => {
        const members = Array.isArray(conversation.members)
          ? conversation.members
          : [];
        const otherMember = members.find(
          (member: ChatConversationMember) =>
            member.userCode &&
            auth.user?.userCode &&
            member.userCode !== auth.user.userCode,
        );

        const messages: ChatMessage[] = getConversationMessages(
          conversation.conversationID,
        );

        const text =
          messageTextByConversation[conversation.conversationID] || "";
        const pickedFiles =
          filesByConversation[conversation.conversationID] || [];

        const popupNode = (
          <div
            key={conversation.conversationID}
            style={{
              position: "fixed",
              bottom: 20,
              right: 20 + index * (370 + 12),
              width: 370,
              maxWidth: "calc(100vw - 24px)",
              height: 560,
              background: palette.popupBg,
              border: palette.popupBorder,
              borderRadius: 14,
              boxShadow: "0 18px 42px rgba(0,0,0,0.25)",
              zIndex: 1400 + index,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid rgba(148,163,184,0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: 58,
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "rgba(243,112,33,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {otherMember?.avatarURL ? (
                    <img
                      src={getAvatarUrl(otherMember.avatarURL)}
                      alt={
                        otherMember.fullName ||
                        conversation.title ||
                        "chat-user"
                      }
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span>
                      {(otherMember?.fullName || conversation.title || "C")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: palette.titleColor,
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {otherMember?.fullName ||
                      conversation.title ||
                      conversation.conversationCode}
                  </div>
                  <div style={{ fontSize: 12, color: palette.subtitleColor }}>
                    {otherMember?.userRole || "Trò chuyện trực tiếp"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  void closeConversationPopup(conversation.conversationID);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: palette.subtitleColor,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              ref={(node) => {
                messageListRefs.current[conversation.conversationID] = node;
              }}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "rgba(248,250,252,0.35)",
              }}
              onScroll={(event) => {
                const element = event.currentTarget;
                const distanceToBottom =
                  element.scrollHeight -
                  element.scrollTop -
                  element.clientHeight;
                const isNearBottom = distanceToBottom <= 80;

                setIsNearBottomByConversation((prev) => ({
                  ...prev,
                  [conversation.conversationID]: isNearBottom,
                }));

                if (isNearBottom) {
                  setShowNewMessageByConversation((prev) => ({
                    ...prev,
                    [conversation.conversationID]: false,
                  }));
                  void markConversationRead(conversation.conversationID);
                }
              }}
            >
              {loadingMessages &&
                conversation.conversationID === activeConversationId && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: palette.subtitleColor,
                      fontSize: 12,
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    <Loader2 size={14} className="animate-spin" /> Đang tải tin
                    nhắn...
                  </div>
                )}

              {messages.length === 0 && !loadingMessages && (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    color: palette.subtitleColor,
                    fontSize: 13,
                  }}
                >
                  Bắt đầu cuộc trò chuyện bằng một tin nhắn mới.
                </div>
              )}

              {messages.map((message: ChatMessage) => {
                const isMine =
                  !!message.senderUserCode &&
                  !!auth.user?.userCode &&
                  String(message.senderUserCode) === String(auth.user.userCode);

                const attachments = Array.isArray(message.attachments)
                  ? message.attachments
                  : [];
                const reactions = Array.isArray(message.reactions)
                  ? message.reactions
                  : [];

                const memberByCode = new Map(
                  (conversation.members || [])
                    .filter((member) => !!member.userCode)
                    .map((member) => [String(member.userCode), member]),
                );

                const reactionGroups = Object.values(
                  reactions.reduce<
                    Record<
                      string,
                      {
                        reactionType: string;
                        count: number;
                        items: ChatMessageReaction[];
                      }
                    >
                  >((acc, reaction) => {
                    const key = String(reaction.reactionType || "");
                    if (!key) return acc;

                    if (!acc[key]) {
                      acc[key] = {
                        reactionType: key,
                        count: 0,
                        items: [],
                      };
                    }

                    acc[key].count += 1;
                    acc[key].items.push(reaction);
                    return acc;
                  }, {}),
                );

                const myReaction = reactions.find(
                  (item) =>
                    item.userCode &&
                    auth.user?.userCode &&
                    item.userCode === auth.user.userCode,
                );

                const readState = getReadState(
                  message,
                  conversation.conversationID,
                );

                const readers = (readState.readBy || []).filter(
                  (m) => m.userCode && m.userCode !== message.senderUserCode,
                );
                const hasReaders = readers.length > 0;
                const readerKey = `read-${conversation.conversationID}-${message.messageID}`;

                // determine newest message from current user by timestamp
                let latestStamp = "";
                if (messages.length) {
                  messages.forEach((m) => {
                    if (
                      m.senderUserCode &&
                      auth.user?.userCode &&
                      String(m.senderUserCode) === String(auth.user.userCode) &&
                      m.sentAt &&
                      (latestStamp === "" || m.sentAt > latestStamp)
                    ) {
                      latestStamp = m.sentAt;
                    }
                  });
                }
                const isLatestForSender =
                  isMine && message.sentAt && message.sentAt === latestStamp;

                return (
                  <div
                    key={String(message.messageID)}
                    style={{
                      alignSelf: isMine ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      padding: "8px 10px",
                      borderRadius: 12,
                      background: isMine
                        ? palette.selfMessageBg
                        : palette.otherMessageBg,
                      border: "1px solid rgba(148,163,184,0.15)",
                      position: "relative",
                      marginBottom: reactions.length > 0 ? 28 : 20,
                    }}
                  >
                    {!isMine && (
                      <div
                        style={{
                          fontSize: 11,
                          color: palette.subtitleColor,
                          marginBottom: 3,
                          fontWeight: 600,
                        }}
                      >
                        {otherMember?.fullName ||
                          message.senderUserCode ||
                          "Người dùng"}
                      </div>
                    )}

                    {!!message.content && (
                      <div
                        style={{
                          color: palette.titleColor,
                          fontSize: 13,
                          lineHeight: 1.45,
                          marginBottom: attachments.length ? 8 : 0,
                        }}
                      >
                        {message.content}
                      </div>
                    )}

                    {attachments.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          marginBottom: 8,
                        }}
                      >
                        {attachments.map((attachment) => {
                          const resolvedUrl = resolveAttachmentUrl(
                            attachment.fileURL ||
                              attachment.fileUrl ||
                              attachment.localPreviewURL,
                          );
                          const isFailed = attachment.uploadStatus === "failed";
                          const isUploading =
                            attachment.uploadStatus === "uploading";

                          if (isImageAttachment(attachment)) {
                            return (
                              <div
                                key={attachment.attachmentID}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  borderRadius: 10,
                                  overflow: "hidden",
                                  border: "1px solid rgba(148,163,184,0.25)",
                                  background: "#fff",
                                }}
                              >
                                {resolvedUrl ? (
                                  <a
                                    href={resolvedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: "block" }}
                                  >
                                    <img
                                      src={resolvedUrl}
                                      alt={
                                        attachment.fileName ||
                                        "attachment-image"
                                      }
                                      style={{
                                        width: "100%",
                                        maxHeight: 220,
                                        objectFit: "cover",
                                        opacity: isFailed ? 0.7 : 1,
                                      }}
                                    />
                                  </a>
                                ) : null}

                                {(isUploading || isFailed) && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 8,
                                      padding: "6px 8px",
                                      fontSize: 11,
                                      color: isFailed
                                        ? "#dc2626"
                                        : palette.subtitleColor,
                                      borderTop:
                                        "1px solid rgba(148,163,184,0.2)",
                                    }}
                                  >
                                    <span>
                                      {isUploading
                                        ? "Đang tải ảnh..."
                                        : attachment.uploadError ||
                                          "Tải ảnh thất bại"}
                                    </span>
                                    {isFailed && (
                                      <button
                                        onClick={() => {
                                          void retryAttachmentUpload(
                                            conversation.conversationID,
                                            message.messageID,
                                            attachment.attachmentID,
                                          );
                                        }}
                                        style={{
                                          border: "none",
                                          background: "transparent",
                                          color: "#2563eb",
                                          cursor: "pointer",
                                          fontSize: 11,
                                          fontWeight: 600,
                                        }}
                                      >
                                        Thử lại
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div
                              key={attachment.attachmentID}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                flexDirection: "column",
                                gap: 8,
                                border: "1px solid rgba(148,163,184,0.25)",
                                borderRadius: 10,
                                padding: "6px 8px",
                                color: palette.titleColor,
                                background: "#fff",
                              }}
                            >
                              <a
                                href={resolvedUrl || undefined}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  textDecoration: "none",
                                  color: palette.titleColor,
                                  width: "100%",
                                  opacity: isFailed ? 0.7 : 1,
                                }}
                              >
                                <Paperclip size={14} />
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 600,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {attachment.fileName || "Tệp đính kèm"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: palette.subtitleColor,
                                    }}
                                  >
                                    {formatFileSize(attachment.fileSizeBytes)}
                                  </div>
                                </div>
                              </a>

                              {(isUploading || isFailed) && (
                                <div
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    fontSize: 11,
                                    color: isFailed
                                      ? "#dc2626"
                                      : palette.subtitleColor,
                                  }}
                                >
                                  <span>
                                    {isUploading
                                      ? "Đang tải tệp..."
                                      : attachment.uploadError ||
                                        "Tải tệp thất bại"}
                                  </span>
                                  {isFailed && (
                                    <button
                                      onClick={() => {
                                        void retryAttachmentUpload(
                                          conversation.conversationID,
                                          message.messageID,
                                          attachment.attachmentID,
                                        );
                                      }}
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#2563eb",
                                        cursor: "pointer",
                                        fontSize: 11,
                                        fontWeight: 600,
                                      }}
                                    >
                                      Thử lại
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: 4,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: palette.subtitleColor,
                          fontStyle: message.isOptimistic ? "italic" : "normal",
                        }}
                      >
                        {message.isOptimistic
                          ? "Đang gửi..."
                          : formatMessageTime(message.sentAt)}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {/* read count handled by chip below */}
                      </div>
                    </div>

                    <div
                      ref={
                        message.messageID === pickerMessageId
                          ? pickerContainerRef
                          : undefined
                      }
                      style={{
                        position: "absolute",
                        bottom: -22,
                        [isMine ? "left" : "right"]: 8,
                        zIndex: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        maxWidth: "100%",
                      }}
                    >
                      {reactionGroups.length > 0 && (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            flexWrap: "wrap",
                            maxWidth: 250,
                          }}
                        >
                          {reactionGroups.map((group) => {
                            const reactionIcon =
                              reactionIconMap[group.reactionType] || "🙂";
                            const hoverKey = `${conversation.conversationID}:${message.messageID}:${group.reactionType}`;
                            const hovered = hoveredReactionKey === hoverKey;

                            return (
                              <div
                                key={hoverKey}
                                style={{ position: "relative" }}
                                onMouseEnter={() =>
                                  setHoveredReactionKey(hoverKey)
                                }
                                onMouseLeave={() => setHoveredReactionKey(null)}
                              >
                                <button
                                  type="button"
                                  style={{
                                    border: "1px solid rgba(148,163,184,0.35)",
                                    background: "rgba(255,255,255,0.95)",
                                    borderRadius: 999,
                                    padding: "2px 8px",
                                    fontSize: 12,
                                    color: palette.titleColor,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    cursor: "default",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                                  }}
                                >
                                  <span>{String(reactionIcon)}</span>
                                  <span style={{ fontWeight: 600 }}>
                                    {group.count}
                                  </span>
                                </button>

                                {hovered && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      bottom: "calc(100% + 6px)",
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      minWidth: 180,
                                      maxWidth: 240,
                                      background: "#fff",
                                      border:
                                        "1px solid rgba(148,163,184,0.25)",
                                      borderRadius: 10,
                                      boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
                                      padding: 8,
                                      zIndex: 1500,
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: palette.subtitleColor,
                                        marginBottom: 6,
                                      }}
                                    >
                                      {String(reactionIcon)} {group.count} người
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 5,
                                        maxHeight: 140,
                                        overflowY: "auto",
                                      }}
                                    >
                                      {group.items.map((reaction) => {
                                        const member = reaction.userCode
                                          ? memberByCode.get(
                                              String(reaction.userCode),
                                            )
                                          : undefined;
                                        const displayName =
                                          reaction.displayName ||
                                          member?.fullName ||
                                          reaction.userCode ||
                                          "Người dùng";
                                        const avatar = resolveReactionAvatar(
                                          reaction.avatarUrl ||
                                            member?.avatarURL ||
                                            "",
                                        );

                                        return (
                                          <div
                                            key={`${hoverKey}-${reaction.reactionID}`}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 6,
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: "50%",
                                                overflow: "hidden",
                                                background:
                                                  "rgba(148,163,184,0.2)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 10,
                                                fontWeight: 700,
                                              }}
                                            >
                                              {avatar ? (
                                                <img
                                                  src={avatar}
                                                  alt={displayName}
                                                  style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                  }}
                                                />
                                              ) : (
                                                <span>
                                                  {String(displayName)
                                                    .charAt(0)
                                                    .toUpperCase()}
                                                </span>
                                              )}
                                            </div>
                                            <span
                                              style={{
                                                fontSize: 12,
                                                color: palette.titleColor,
                                              }}
                                            >
                                              {displayName}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {hasReaders && isLatestForSender && (
                            <div
                              style={{
                                position: "relative",
                                display: "inline-flex",
                                alignItems: "center",
                                marginLeft: "auto",
                              }}
                              onMouseEnter={() =>
                                setHoveredReactionKey(readerKey)
                              }
                              onMouseLeave={() => setHoveredReactionKey(null)}
                            >
                              <button
                                type="button"
                                style={{
                                  border: "1px solid rgba(148,163,184,0.35)",
                                  background: "rgba(255,255,255,0.95)",
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                  fontSize: 12,
                                  color: palette.titleColor,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  cursor: "default",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                                }}
                              >
                                <Eye size={14} />
                                <span style={{ fontWeight: 600 }}>
                                  {readers.length}
                                </span>
                              </button>
                              {hoveredReactionKey === readerKey && (
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: "calc(100% + 6px)",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    minWidth: 180,
                                    maxWidth: 240,
                                    background: "#fff",
                                    border: "1px solid rgba(148,163,184,0.25)",
                                    borderRadius: 10,
                                    boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
                                    padding: 8,
                                    zIndex: 1500,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: palette.subtitleColor,
                                      marginBottom: 6,
                                    }}
                                  >
                                    <Eye size={12} /> {readers.length} đã xem
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 5,
                                      maxHeight: 140,
                                      overflowY: "auto",
                                    }}
                                  >
                                    {readers.map((reader) => {
                                      const avatar = reader.avatarURL
                                        ? getAvatarUrl(reader.avatarURL)
                                        : "";
                                      const displayName =
                                        reader.fullName ||
                                        reader.userCode ||
                                        "Người dùng";
                                      return (
                                        <div
                                          key={reader.userCode}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: 20,
                                              height: 20,
                                              borderRadius: "50%",
                                              overflow: "hidden",
                                              background:
                                                "rgba(148,163,184,0.2)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: 10,
                                              fontWeight: 700,
                                            }}
                                          >
                                            {avatar ? (
                                              <img
                                                src={avatar}
                                                alt={displayName}
                                                style={{
                                                  width: "100%",
                                                  height: "100%",
                                                  objectFit: "cover",
                                                }}
                                              />
                                            ) : (
                                              <span>
                                                {String(displayName)
                                                  .charAt(0)
                                                  .toUpperCase()}
                                              </span>
                                            )}
                                          </div>
                                          <span
                                            style={{
                                              fontSize: 12,
                                              color: palette.titleColor,
                                            }}
                                          >
                                            {displayName}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onMouseEnter={() => {
                          if (!myReaction) {
                            setPickerMessageId(message.messageID);
                          }
                        }}
                        onClick={() => {
                          if (myReaction) {
                            void toggleReaction(
                              message.conversationID,
                              message.messageID,
                              myReaction.reactionType,
                              true,
                            );
                            return;
                          }
                          setPickerMessageId(message.messageID);
                        }}
                        style={{
                          border: "1px solid rgba(148,163,184,0.35)",
                          background: "rgba(255,255,255,0.95)",
                          cursor: "pointer",
                          fontSize: myReaction ? 15 : 12,
                          color: myReaction ? palette.titleColor : "#94a3b8",
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          outline: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                          padding: 0,
                        }}
                        title={myReaction ? "Bấm để gỡ cảm xúc" : "Thả cảm xúc"}
                      >
                        {myReaction ? (
                          String(
                            reactionIconMap[myReaction.reactionType] || "🙂",
                          )
                        ) : (
                          <Smile size={14} />
                        )}
                      </button>

                      {pickerMessageId === message.messageID && !myReaction && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "calc(100% + 6px)",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            gap: 2,
                            padding: 4,
                            background: "#fff",
                            border: "1px solid rgba(148,163,184,0.25)",
                            borderRadius: 999,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            zIndex: 1500,
                          }}
                        >
                          {Object.entries(reactionIconMap).map(
                            ([reactionType, icon]) => {
                              return (
                                <button
                                  key={`${message.messageID}-picker-${reactionType}`}
                                  onClick={() => {
                                    void toggleReaction(
                                      message.conversationID,
                                      message.messageID,
                                      reactionType,
                                      false,
                                    );
                                    setPickerMessageId(null);
                                  }}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    fontSize: 14,
                                    opacity: 0.85,
                                    padding: "0 2px",
                                  }}
                                  title={`Reaction ${reactionType}`}
                                >
                                  {String(icon)}
                                </button>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div
                ref={(node) => {
                  messageEndRefs.current[conversation.conversationID] = node;
                }}
                style={{ height: 1 }}
              />
            </div>

            {showNewMessageByConversation[conversation.conversationID] && (
              <div
                style={{
                  position: "absolute",
                  bottom: 64,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              >
                <button
                  onClick={() => {
                    scrollToBottom(conversation.conversationID, "smooth");
                    setShowNewMessageByConversation((prev) => ({
                      ...prev,
                      [conversation.conversationID]: false,
                    }));
                    setIsNearBottomByConversation((prev) => ({
                      ...prev,
                      [conversation.conversationID]: true,
                    }));
                    void markConversationRead(conversation.conversationID);
                  }}
                  style={{
                    pointerEvents: "auto",
                    border: "none",
                    borderRadius: 999,
                    background: palette.buttonBg,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 12px",
                    cursor: "pointer",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
                  }}
                >
                  Tin nhắn mới
                </button>
              </div>
            )}

            {!!pickedFiles.length && (
              <div
                style={{
                  borderTop: "1px solid rgba(148,163,184,0.2)",
                  padding: "8px 10px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {pickedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid rgba(148,163,184,0.35)",
                      borderRadius: 999,
                      padding: "2px 8px",
                      fontSize: 11,
                      color: palette.titleColor,
                    }}
                  >
                    <span>{isImageFile(file) ? "🖼️" : "📎"}</span>
                    <span
                      style={{
                        maxWidth: 140,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </span>
                    <button
                      onClick={() =>
                        removePickedFile(conversation.conversationID, idx)
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: palette.subtitleColor,
                        fontSize: 12,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                borderTop: "1px solid rgba(148,163,184,0.2)",
                padding: "10px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                ref={(node) => {
                  fileInputRefs.current[conversation.conversationID] = node;
                }}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  handleFilesChange(
                    conversation.conversationID,
                    e.target.files,
                  );
                  e.currentTarget.value = "";
                }}
              />

              <button
                onClick={() =>
                  openFilePicker(conversation.conversationID, "file")
                }
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                  color: palette.titleColor,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Đính kèm file"
              >
                <Paperclip size={15} />
              </button>

              <button
                onClick={() =>
                  openFilePicker(conversation.conversationID, "image")
                }
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                  color: palette.titleColor,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Đính kèm ảnh"
              >
                <Image size={15} />
              </button>

              <input
                value={text}
                onChange={(e) =>
                  setMessageTextByConversation((prev) => ({
                    ...prev,
                    [conversation.conversationID]: e.target.value,
                  }))
                }
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend(conversation.conversationID);
                  }
                }}
                onFocus={() => {
                  if (
                    Number(activeConversationId) !==
                    Number(conversation.conversationID)
                  ) {
                    void selectConversation(conversation.conversationID);
                  }
                }}
                placeholder="Nhập tin nhắn..."
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  outline: "none",
                  padding: "0 12px",
                  fontSize: 13,
                  color: palette.titleColor,
                  caretColor: palette.titleColor,
                  background: "#fff",
                }}
              />

              <button
                onClick={() => {
                  void handleSend(conversation.conversationID);
                }}
                disabled={!text.trim() && pickedFiles.length === 0}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "none",
                  cursor:
                    !text.trim() && pickedFiles.length === 0
                      ? "not-allowed"
                      : "pointer",
                  background:
                    !text.trim() && pickedFiles.length === 0
                      ? "#cbd5e1"
                      : palette.buttonBg,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Gửi tin nhắn"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        );

        if (typeof document === "undefined") {
          return popupNode;
        }

        return createPortal(popupNode, document.body);
      })}
    </div>
  );
};

export default ChatWidget;
