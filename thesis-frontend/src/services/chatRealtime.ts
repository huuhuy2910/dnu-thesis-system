import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { getAccessToken } from "./auth-session.service";
import type { ChatRealtimeEvent } from "../types/chat";

export type ChatRealtimeListener = (event: ChatRealtimeEvent) => void;

const envBaseRaw = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5180"
).toString();

const ensureScheme = (value: string) =>
  /^https?:\/\//i.test(value) ? value : `http://${value}`;

const normalizedBase = (() => {
  const value = ensureScheme(envBaseRaw.trim());
  return value.endsWith("/") ? value.slice(0, -1) : value;
})();

const defaultHubUrl = `${normalizedBase}/hubs/chat`;
const hubUrl = (import.meta.env.VITE_CHAT_HUB_URL || defaultHubUrl).toString();

export class ChatRealtimeService {
  private connection: HubConnection | null = null;

  private listeners = new Set<ChatRealtimeListener>();

  private joinedConversations = new Set<string>();

  private joinedConversationIds = new Set<number>();

  private conversationCodeToId = new Map<string, number>();

  private started = false;

  private notify(event: ChatRealtimeEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private getConnection(): HubConnection {
    if (this.connection) return this.connection;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getAccessToken() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.onreconnected(async () => {
      const joinedCodes = Array.from(this.joinedConversations);
      for (const conversationCode of joinedCodes) {
        try {
          await connection.invoke("JoinConversation", conversationCode);
        } catch {
          const fallbackId = this.conversationCodeToId.get(conversationCode);
          if (fallbackId && Number.isFinite(fallbackId)) {
            try {
              await connection.invoke("JoinConversationById", fallbackId);
            } catch {
              // ignore and continue to keep reconnect resilient
            }
          }
        }
      }

      const joinedIds = Array.from(this.joinedConversationIds);
      for (const conversationId of joinedIds) {
        try {
          await connection.invoke("JoinConversationById", conversationId);
        } catch {
          // ignore and continue to keep reconnect resilient
        }
      }
    });

    const resolveConversationCode = (payload: unknown): string | undefined => {
      if (!payload || typeof payload !== "object") return undefined;
      const source = payload as Record<string, unknown>;
      const candidate = source.conversationCode;
      return typeof candidate === "string" ? candidate : undefined;
    };

    const resolveConversationID = (payload: unknown): number | undefined => {
      if (!payload || typeof payload !== "object") return undefined;
      const source = payload as Record<string, unknown>;
      const candidate =
        source.conversationID ?? source.conversationId ?? source.ConversationID;
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return candidate;
      }
      if (typeof candidate === "string" && candidate.trim()) {
        const parsed = Number(candidate);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };

    const resolveMessageID = (payload: unknown): number | undefined => {
      if (!payload || typeof payload !== "object") return undefined;
      const source = payload as Record<string, unknown>;
      const candidate =
        source.messageID ?? source.messageId ?? source.MessageID;
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return candidate;
      }
      if (typeof candidate === "string" && candidate.trim()) {
        const parsed = Number(candidate);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };

    connection.on("message.created", (payload: unknown) => {
      this.notify({
        type: "message.created",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("message.updated", (payload: unknown) => {
      this.notify({
        type: "message.updated",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("message.deleted", (payload: unknown) => {
      this.notify({
        type: "message.deleted",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("message.attachment.created", (payload: unknown) => {
      this.notify({
        type: "message.attachment.created",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("message.attachment.updated", (payload: unknown) => {
      this.notify({
        type: "message.attachment.updated",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("message.attachment.deleted", (payload: unknown) => {
      this.notify({
        type: "message.attachment.deleted",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("reaction.created", (payload: unknown) => {
      this.notify({
        type: "reaction.created",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("reaction.updated", (payload: unknown) => {
      this.notify({
        type: "reaction.updated",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("reaction.deleted", (payload: unknown) => {
      this.notify({
        type: "reaction.deleted",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("message.reaction.created", (payload: unknown) => {
      this.notify({
        type: "message.reaction.created",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("message.reaction.updated", (payload: unknown) => {
      this.notify({
        type: "message.reaction.updated",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("message.reaction.deleted", (payload: unknown) => {
      this.notify({
        type: "message.reaction.deleted",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("receipt.updated", (payload: unknown) => {
      this.notify({
        type: "receipt.updated",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("MessageCreated", (payload: unknown) => {
      this.notify({
        type: "message.created",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("MessageUpdated", (payload: unknown) => {
      this.notify({
        type: "message.updated",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("MessageDeleted", (payload: unknown) => {
      this.notify({
        type: "message.deleted",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("ReactionUpdated", (payload: unknown) => {
      this.notify({
        type: "reaction.updated",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    connection.on("ReceiptUpdated", (payload: unknown) => {
      this.notify({
        type: "receipt.updated",
        payload,
        conversationCode: resolveConversationCode(payload),
        conversationID: resolveConversationID(payload),
        messageID: resolveMessageID(payload),
      });
    });

    this.connection = connection;
    return connection;
  }

  async start(): Promise<void> {
    if (this.started) return;

    const connection = this.getConnection();
    if (connection.state === HubConnectionState.Connected) {
      this.started = true;
      return;
    }

    await connection.start();
    this.started = true;
  }

  async stop(): Promise<void> {
    if (!this.connection) return;

    try {
      await this.connection.stop();
    } finally {
      this.started = false;
      this.joinedConversations.clear();
      this.joinedConversationIds.clear();
      this.conversationCodeToId.clear();
    }
  }

  subscribe(listener: ChatRealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async joinConversation(
    conversationCode: string,
    conversationId?: number,
  ): Promise<void> {
    const code = String(conversationCode || "").trim();
    if (!code) return;

    const connection = this.getConnection();
    if (connection.state !== HubConnectionState.Connected) {
      await this.start();
    }

    await connection.invoke("JoinConversation", code);
    this.joinedConversations.add(code);

    const id = Number(conversationId);
    if (Number.isFinite(id) && id > 0) {
      this.joinedConversationIds.add(id);
      this.conversationCodeToId.set(code, id);
    }
  }

  async joinConversationById(conversationId: number): Promise<void> {
    const id = Number(conversationId);
    if (!Number.isFinite(id) || id <= 0) return;

    const connection = this.getConnection();
    if (connection.state !== HubConnectionState.Connected) {
      await this.start();
    }

    await connection.invoke("JoinConversationById", id);
    this.joinedConversationIds.add(id);
  }

  async leaveConversation(conversationCode: string): Promise<void> {
    const code = String(conversationCode || "").trim();
    if (!code || !this.connection) return;

    if (this.connection.state === HubConnectionState.Connected) {
      await this.connection.invoke("LeaveConversation", code);
    }

    this.joinedConversations.delete(code);
    this.conversationCodeToId.delete(code);
  }

  async leaveConversationById(conversationId: number): Promise<void> {
    const id = Number(conversationId);
    if (!Number.isFinite(id) || id <= 0 || !this.connection) return;

    if (this.connection.state === HubConnectionState.Connected) {
      await this.connection.invoke("LeaveConversationById", id);
    }

    this.joinedConversationIds.delete(id);
  }
}

export const chatRealtime = new ChatRealtimeService();
