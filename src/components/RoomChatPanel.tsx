import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, Smile, X } from "lucide-react";
import { CHAT_EMOJI_GROUPS, CHAT_MESSAGE_MAX_CHARS } from "../constants/chatEmojis";
import { QUICK_CHAT_PHRASES } from "../constants/quickChatPhrases";
import { useRoomChat } from "../hooks/useRoomChat";

type RoomChatPanelProps = {
  roomCode: string;
  theme: "light" | "dark";
  localPlayerName: string;
  localUserId?: string | null;
  /** Lobby: inline. Game: slide-over sidebar + FAB with unread badge. */
  layout: "embedded" | "sidebar";
  /** In-game only: toast when someone sends chat while sidebar is closed. */
  onChatBackgroundNotify?: (payload: { username: string; text: string }) => void;
};

export function RoomChatPanel({
  roomCode,
  theme,
  localPlayerName,
  localUserId = null,
  layout,
  onChatBackgroundNotify,
}: RoomChatPanelProps) {
  const isDark = theme === "dark";
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(layout === "embedded");
  const openRef = useRef(open);
  openRef.current = open;

  const { messages, sendMessage } = useRoomChat(roomCode, {
    localUserId,
    localPlayerName,
    onIncomingFromOther:
      layout === "sidebar"
        ? (msg) => {
            if (openRef.current) return;
            onChatBackgroundNotify?.({
              username: msg.username,
              text: msg.text,
            });
          }
        : undefined,
  });
  const [lastReadMaxSentAt, setLastReadMaxSentAt] = useState(0);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (layout === "embedded") {
      if (messages.length === 0) return;
      const maxT = Math.max(...messages.map((m) => m.sentAt));
      setLastReadMaxSentAt((r) => Math.max(r, maxT));
      return;
    }
    if (open && messages.length > 0) {
      const maxT = Math.max(...messages.map((m) => m.sentAt));
      setLastReadMaxSentAt((r) => Math.max(r, maxT));
    }
  }, [layout, open, messages]);

  const unreadCount = useMemo(() => {
    if (layout !== "sidebar" || open) return 0;
    return messages.filter((m) => m.sentAt > lastReadMaxSentAt).length;
  }, [layout, open, messages, lastReadMaxSentAt]);

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !emojiPickerRef.current?.contains(t) &&
        !emojiButtonRef.current?.contains(t)
      ) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [emojiPickerOpen]);

  /** Avoid refocusing after each emoji — that toggles the mobile keyboard. */
  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    if (next.length > CHAT_MESSAGE_MAX_CHARS) return;
    setDraft(next);
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input || document.activeElement !== input) return;
      const pos = start + emoji.length;
      try {
        input.setSelectionRange(pos, pos);
      } catch {
        /* ignore */
      }
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
    setEmojiPickerOpen(false);
  };

  const sendQuickPhrase = (phrase: string) => {
    const t = phrase.trim();
    if (!t || t.length > CHAT_MESSAGE_MAX_CHARS) return;
    sendMessage(t);
    setEmojiPickerOpen(false);
  };

  const shellClass =
    isDark
      ? "border-zinc-700 bg-zinc-900/95 text-stone-200"
      : "border-gray-200 bg-white/98 text-gray-800";

  const headerClass =
    isDark ? "border-zinc-700 text-stone-400" : "border-gray-200 text-gray-500";

  const list = (
    <div
      ref={listRef}
      className={`flex-1 min-h-0 overflow-y-auto space-y-2 px-2 py-2 text-sm ${
        layout === "embedded" ? "max-h-48" : "min-h-0"
      }`}
    >
      {messages.length === 0 ? (
        <p
          className={`text-xs text-center py-4 ${
            isDark ? "text-stone-500" : "text-gray-500"
          }`}
        >
          No messages yet. Say hi to the room.
        </p>
      ) : (
        messages.map((m, i) => {
          const isSelf = localUserId
            ? m.userId === localUserId
            : m.username === localPlayerName;
          return (
            <div
              key={`${m.sentAt}-${m.userId}-${i}`}
              className={`flex min-w-0 ${isSelf ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[min(20rem,85%)] min-w-0 w-fit rounded-lg px-2 py-1.5 ${
                  isSelf
                    ? isDark
                      ? "bg-amber-900/35"
                      : "bg-amber-50"
                    : isDark
                      ? "bg-zinc-800/80"
                      : "bg-gray-100"
                }`}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${
                    isDark ? "text-amber-500/90" : "text-amber-600"
                  }`}
                >
                  {m.username}
                  {isSelf ? " (you)" : ""}
                </div>
                <p className="break-words whitespace-pre-wrap leading-snug text-base [font-family:system-ui,emoji,sans-serif]">
                  {m.text}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const emojiPanelClass = isDark
    ? "border-zinc-600 bg-zinc-800 shadow-xl"
    : "border-gray-200 bg-white shadow-xl";

  const emojiToggleButton = (
    <button
      ref={emojiButtonRef}
      type="button"
      title="Emoji"
      onClick={() => {
        setEmojiPickerOpen((v) => !v);
      }}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors sm:h-10 sm:w-10 ${
        emojiPickerOpen ? "self-start" : "self-center"
      } ${
        isDark
          ? "border-zinc-600 bg-zinc-800 text-amber-400 hover:bg-zinc-700"
          : "border-gray-200 bg-gray-50 text-amber-700 hover:bg-gray-100"
      } ${emojiPickerOpen ? "ring-2 ring-amber-500/50" : ""}`}
      aria-expanded={emojiPickerOpen}
      aria-haspopup="dialog"
      aria-label="Insert emoji"
    >
      <Smile className="w-5 h-5" aria-hidden />
    </button>
  );

  const form = (
    <form
      onSubmit={submit}
      className="grid shrink-0 grid-cols-[minmax(0,1fr)_2.75rem] items-center gap-x-2 gap-y-2 border-t border-inherit p-2"
    >
      {emojiPickerOpen ? (
        <div
          ref={emojiPickerRef}
          role="dialog"
          aria-label="Emoji picker"
          className={`min-h-0 min-w-0 max-h-52 overflow-y-auto rounded-xl border p-2 ${emojiPanelClass}`}
        >
          {CHAT_EMOJI_GROUPS.map((group) => (
            <div key={group.label} className="mb-2 last:mb-0">
              <div
                className={`mb-1 px-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  isDark ? "text-stone-500" : "text-gray-500"
                }`}
              >
                {group.label}
              </div>
              <div className="grid grid-cols-8 gap-0.5">
                {group.emojis.map((emoji, ei) => (
                  <button
                    key={`${group.label}-${ei}`}
                    type="button"
                    className={`flex h-9 w-full items-center justify-center rounded text-lg leading-none transition-colors active:scale-95 sm:h-8 sm:hover:scale-110 ${
                      isDark ? "hover:bg-zinc-700" : "hover:bg-gray-100"
                    }`}
                    onClick={() => insertEmoji(emoji)}
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="hide-scrollbar flex min-h-0 min-w-0 touch-pan-x flex-nowrap gap-2 overflow-x-auto overflow-y-hidden py-0.5"
          role="region"
          aria-label="Quick messages"
        >
          {QUICK_CHAT_PHRASES.map((phrase) => (
            <button
              key={phrase}
              type="button"
              className={`shrink-0 rounded-md px-1.5 py-1 text-xs font-medium leading-tight whitespace-nowrap transition-colors active:opacity-80 ${
                isDark
                  ? "text-stone-400 hover:bg-zinc-800/80 hover:text-stone-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              onClick={() => sendQuickPhrase(phrase)}
            >
              {phrase}
            </button>
          ))}
        </div>
      )}
      {emojiToggleButton}
      <input
        ref={inputRef}
        type="text"
        enterKeyHint="send"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={CHAT_MESSAGE_MAX_CHARS}
        placeholder="Message the room…"
        autoComplete="off"
        className={`min-h-11 min-w-0 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/50 sm:min-h-10 sm:py-2 ${
          isDark
            ? "border-zinc-600 bg-zinc-800 text-stone-100 placeholder:text-stone-500"
            : "border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400"
        }`}
      />
      <button
        type="submit"
        disabled={!draft.trim()}
        title="Send"
        className="flex h-11 w-full shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10"
      >
        <Send className="w-5 h-5" aria-hidden />
      </button>
    </form>
  );

  if (layout === "embedded") {
    return (
      <div className={`rounded-2xl border-2 overflow-visible flex flex-col ${shellClass}`}>
        <div
          className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b ${headerClass}`}
        >
          Room chat
        </div>
        {list}
        {form}
      </div>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-none sm:max-w-sm border-l-0 sm:border-l-2 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${shellClass} ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div
          className={`flex items-center justify-between px-3 py-3 border-b shrink-0 ${isDark ? "border-zinc-700" : "border-gray-200"}`}
        >
          <span className={`text-xs font-bold uppercase tracking-wider ${headerClass} border-0`}>
            Room chat
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? "hover:bg-zinc-800 text-stone-400" : "hover:bg-gray-100 text-gray-500"
            }`}
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {list}
        {form}
      </aside>

      <div className="fixed bottom-4 right-4 z-40 pointer-events-none flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pointer-events-auto relative flex items-center justify-center w-14 h-14 rounded-full bg-amber-600 text-white shadow-lg hover:bg-amber-500 transition-colors"
          aria-label={open ? "Hide chat" : "Open chat"}
        >
          <MessageCircle className="w-7 h-7" />
          {unreadCount > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold border-2 shadow-sm ${
                isDark ? "border-zinc-900" : "border-white"
              }`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
