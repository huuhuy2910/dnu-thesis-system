import { useContext } from "react";
import { ChatContext, type ChatContextValue } from "../context/ChatContext";

type UseChatValue = ChatContextValue;

export function useChat(): UseChatValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
