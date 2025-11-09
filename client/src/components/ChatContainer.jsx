import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Paperclip, Loader2, CornerUpLeft } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ChatContainer({
  chatType, // "group" or "module"
  chatId, // channelId or moduleId
  user,
  profile,
  student,
  allowed,
  setAllowed,
  chatInfo,
  setChatInfo,
  messages,
  setMessages,
  content,
  setContent,
  file,
  setFile,
  fileError,
  setFileError,
  replyTarget,
  setReplyTarget,
  sending,
  setSending,
  messagesEndRef,
  lastSeenRef,
  handleSend,
  navigate,
  headerTitle,
  deniedText,
  deniedButtonText,
  deniedButtonLink,
}) {
  const [chatOnlineCount, setChatOnlineCount] = useState(0);
  const isMyMessage = (msg) => msg.userid === student?.id;

  // Presence: track how many users are currently in this chat
  useEffect(() => {
    if (!student || !allowed) return;
    const presenceChannel = supabase.channel(`presence-chat-${chatId}`, {
      config: { presence: { key: student.id } },
    });

    const updateFromState = () => {
      try {
        const state = presenceChannel.presenceState?.() || {};
        setChatOnlineCount(Object.keys(state).length);
      } catch (e) {
        // ignore
      }
    };

    // sync and diffs
    presenceChannel.on("presence", { event: "sync" }, () => {
      updateFromState();
    });
    presenceChannel.on("presence", { event: "join" }, () => updateFromState());
    presenceChannel.on("presence", { event: "leave" }, () => updateFromState());

    presenceChannel.subscribe();

    return () => {
      try {
        supabase.removeChannel(presenceChannel);
      } catch (e) {}
    };
  }, [student, allowed, chatId]);

  if (allowed === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-500">
        Checking access…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 px-6 text-center text-gray-900">
        <h2 className="mb-2 text-2xl font-semibold">Access Denied 🚫</h2>
        <p className="mb-6 max-w-sm text-gray-600">{deniedText}</p>
        <button
          onClick={() => navigate(deniedButtonLink)}
          className="rounded-full bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-500"
        >
          {deniedButtonText}
        </button>
      </div>
    );
  }

  return (
    <div className="font-inter flex h-svh max-h-svh flex-col overflow-hidden text-gray-900">
      {/* Header */}
      <div className="z-10 flex h-16 max-h-16 min-h-16 shrink-0 items-center bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="mr-3 text-gray-500 hover:cursor-pointer hover:text-gray-700"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-baseline space-x-3">
          <h1 className="truncate text-lg font-semibold">{headerTitle}</h1>
          <span className="text-sm text-gray-500">· {chatOnlineCount} online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="scrollbar-thin scrollbar-thumb-gray-300 min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-gray-500">Start the conversation 💬</p>
        ) : (
          messages.map((msg) => {
            const mine = isMyMessage(msg);
            const parent = msg.reply_to_id ? messages.find((m) => m.id === msg.reply_to_id) : null;
            return (
              <div key={msg.id} className={`flex items-end ${mine ? "justify-end" : "justify-start"}`}>
                {!mine &&
                  (msg.students?.profileimage ? (
                    <img src={msg.students.profileimage} alt="" className="mr-2 h-9 w-9 rounded-full border border-gray-300" />
                  ) : (
                    <div className="mr-2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-gray-300 text-lg font-bold text-gray-700">
                      {(msg.students?.displayname || "U")[0].toUpperCase()}
                    </div>
                  ))}
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${mine ? "rounded-br-none bg-blue-600 text-white" : "rounded-bl-none bg-gray-200 text-gray-800"}`}>
                  {parent && (
                    <div className={`mb-2 rounded-lg border bg-gray-200 ${mine ? "border-blue-400/40 bg-blue-500/20" : "border-gray-300 bg-white/60"} px-3 py-2`}>
                      <div className="text-xs font-semibold text-gray-700">{parent.students?.displayname || "User"}</div>
                      {parent.content && (
                        <div className="line-clamp-2 text-xs text-gray-700">{parent.content}</div>
                      )}
                      {!parent.content && parent.attachment_name && (
                        <div className="text-xs text-gray-700">Attachment: {parent.attachment_name}</div>
                      )}
                    </div>
                  )}
                  {!mine && (
                    <span className="mb-1 block text-xs text-gray-500">{msg.students?.displayname || "User"}</span>
                  )}
                  {msg.content && (
                    <p className="text-sm font-medium">{msg.content}</p>
                  )}
                  {msg.attachment_url && (
                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className={`mt-1 block text-xs underline ${mine ? "text-blue-100" : "text-blue-600"}`}>{msg.attachment_name || "View Attachment"}</a>
                  )}
                  <span className={`mt-1 block text-[10px] ${mine ? "text-blue-100" : "text-gray-500"} text-right`}>
                    {new Date(msg.created_at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    })}
                  </span>
                  <div className={`mt-1 flex ${mine ? "justify-start" : "justify-end"}`}>
                    <button type="button" onClick={() => setReplyTarget(msg)} className={`group flex items-center space-x-1 text-[11px] ${mine ? "text-blue-100 hover:text-white" : "text-gray-600 hover:text-gray-800"} hover:cursor-pointer`}>
                      <CornerUpLeft size={14} />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
                {mine &&
                  (student?.profileimage ? (
                    <img src={student.profileimage} alt="" className="ml-2 h-9 w-9 rounded-full border border-gray-300" />
                  ) : (
                    <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-gray-300 text-lg font-bold text-gray-700">
                      {(student?.displayname || "U")[0].toUpperCase()}
                    </div>
                  ))}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="z-10 w-full flex-shrink-0 bg-gray-100 p-4">
        <form onSubmit={handleSend} className="flex w-full flex-col space-y-2">
          {replyTarget && (
            <div className="flex w-full items-start justify-between rounded-lg border border-gray-300 bg-white px-3 py-2">
              <div className="mr-3 min-w-0">
                <div className="text-xs font-semibold text-gray-700">Replying to {replyTarget.students?.displayname || "User"}</div>
                {replyTarget.content && (
                  <div className="line-clamp-2 text-xs break-words text-gray-600">{replyTarget.content}</div>
                )}
                {!replyTarget.content && replyTarget.attachment_name && (
                  <div className="text-xs text-gray-600">Attachment: {replyTarget.attachment_name}</div>
                )}
              </div>
              <button type="button" onClick={() => setReplyTarget(null)} className="text-sm text-gray-500 hover:text-gray-700" aria-label="Cancel reply">✕</button>
            </div>
          )}

          {file && (
            <div className="flex w-full flex-col space-y-1">
              <div className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2">
                <div className="flex items-center space-x-3">
                  <Paperclip size={16} className="text-gray-600" />
                  <div className="max-w-[60vw] truncate text-sm font-medium text-gray-800">{file.name}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <button type="button" onClick={() => { setFile(null); setFileError(""); }} className="text-sm text-gray-500 hover:text-gray-700" aria-label="Remove attached file">✕</button>
                </div>
              </div>
              {fileError && <div className="text-sm text-red-600">{fileError}</div>}
            </div>
          )}

          <div className="flex w-full items-center space-x-3">
            <label htmlFor="file-input" className={`cursor-pointer text-gray-500 hover:text-gray-700 ${sending ? "pointer-events-none opacity-50" : ""}`} title={file ? "Remove current file to attach a new one" : "Attach a file"}>
              <Paperclip size={20} />
              <input id="file-input" type="file" className="hidden" onChange={(e) => {
                if (!e.target.files || e.target.files.length === 0) return;
                if (file) {
                  setFileError("Only one file can be attached at a time. Remove the current file to attach another.");
                  setTimeout(() => setFileError(""), 3500);
                  e.target.value = null;
                  return;
                }
                setFile(e.target.files[0]);
              }} />
            </label>

            <input type="text" placeholder="Type a message..." value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 rounded-full border border-gray-300 bg-white p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none" />

            <button type="submit" disabled={sending} className="bg-primary flex items-center justify-center rounded-full p-3 text-white transition disabled:opacity-50">
              {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
