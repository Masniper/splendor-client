import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../network/socket";
import { useGameAudio } from "../context/GameAudioContext";

export type RoomChatMessage = {
  userId: string;
  username: string;
  text: string;
  sentAt: number;
};

const MAX_MESSAGES = 100;

type ChatHistoryPayload = { roomId: string; messages: RoomChatMessage[] };

export type UseRoomChatOptions = {
  localUserId?: string | null;
  localPlayerName?: string;
  /** Live messages from other players (not history). */
  onIncomingFromOther?: (msg: RoomChatMessage) => void;
};

function isOwnChatMessage(
  data: RoomChatMessage,
  opts: UseRoomChatOptions,
): boolean {
  if (opts.localUserId && data.userId === opts.localUserId) return true;
  const name = opts.localPlayerName?.trim();
  if (name && data.username === name) return true;
  return false;
}

function canIdentifyLocalPlayer(opts: UseRoomChatOptions | undefined): boolean {
  if (!opts) return false;
  return Boolean(opts.localUserId) || Boolean(opts.localPlayerName?.trim());
}

export function useRoomChat(
  roomCode: string | null,
  options?: UseRoomChatOptions,
) {
  const { play } = useGameAudio();
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;
  const pendingHistoryRef = useRef<ChatHistoryPayload | null>(null);
  const chatIdentityRef = useRef(options);
  chatIdentityRef.current = options;
  const incomingFromOtherRef = useRef(options?.onIncomingFromOther);
  incomingFromOtherRef.current = options?.onIncomingFromOther;

  useEffect(() => {
    const applyHistory = (data: ChatHistoryPayload) => {
      if (!data?.roomId || !Array.isArray(data.messages)) return;
      const current = roomCodeRef.current;
      if (current === data.roomId) {
        setMessages(data.messages.slice(-MAX_MESSAGES));
        pendingHistoryRef.current = null;
      } else if (!current) {
        pendingHistoryRef.current = data;
      }
    };

    socket.on("room:chat:history", applyHistory);
    return () => {
      socket.off("room:chat:history", applyHistory);
    };
  }, []);

  useEffect(() => {
    if (!roomCode) {
      setMessages([]);
      pendingHistoryRef.current = null;
      return;
    }

    const pending = pendingHistoryRef.current;
    if (pending?.roomId === roomCode) {
      setMessages(pending.messages.slice(-MAX_MESSAGES));
      pendingHistoryRef.current = null;
    }

    const onMessage = (data: RoomChatMessage) => {
      if (!data?.userId || typeof data.text !== "string") return;
      const opts = chatIdentityRef.current;
      if (
        opts &&
        canIdentifyLocalPlayer(opts) &&
        !isOwnChatMessage(data, opts)
      ) {
        play("chatNotify");
        incomingFromOtherRef.current?.(data);
      }
      setMessages((prev) => {
        const next = [...prev, data];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });
    };

    const onRoomTerminated = () => {
      setMessages([]);
      pendingHistoryRef.current = null;
    };

    socket.on("room:chat:message", onMessage);
    socket.on("room:terminated", onRoomTerminated);

    return () => {
      socket.off("room:chat:message", onMessage);
      socket.off("room:terminated", onRoomTerminated);
    };
  }, [roomCode, play]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!roomCode || !trimmed) return;
      socket.emit("room:chat:send", { text: trimmed });
    },
    [roomCode],
  );

  return { messages, sendMessage };
}
