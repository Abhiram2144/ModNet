import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Paperclip, Loader2, Flag, MoreVertical } from "lucide-react";
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
  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
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
        const count = Object.keys(state).length;
        console.log('Presence state updated:', { state, count });
        setChatOnlineCount(count);
      } catch (e) {
        console.error('Error updating presence:', e);
      }
    };

    // sync and diffs
    presenceChannel.on("presence", { event: "sync" }, () => {
      updateFromState();
    });
    presenceChannel.on("presence", { event: "join" }, () => updateFromState());
    presenceChannel.on("presence", { event: "leave" }, () => updateFromState());

    presenceChannel.subscribe(async (status) => {
      console.log('Presence channel status:', status);
      if (status === "SUBSCRIBED") {
        // Broadcast that this user is online
        const trackResult = await presenceChannel.track({
          user_id: student.id,
          display_name: student.displayname,
        });
        console.log('Track result:', trackResult);
      }
    });

    return () => {
      try {
        presenceChannel.untrack();
        supabase.removeChannel(presenceChannel);
      } catch (e) {}
    };
  }, [student, allowed, chatId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim() || !reportingMessage) return;
    setReportSubmitting(true);

    try {
      const { error } = await supabase.from("reports").insert({
        message_id: reportingMessage.id,
        message_type: "module",
        reported_by: student.id,
        reason: reportReason,
      });

      if (error) throw error;

      alert("Message reported successfully. Admins will review it.");
      setReportingMessage(null);
      setReportReason("");
      setReportDescription("");
    } catch (err) {
      console.error("Report error:", err.message);
      alert("Failed to report message: " + err.message);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    setDeletingMessageId(messageId);

    try {
      const table = chatType === "group" ? "group_messages" : "messages";
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error("Delete error:", err.message);
      alert("Failed to delete message: " + err.message);
    } finally {
      setDeletingMessageId(null);
    }
  };

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
          messages.filter(msg => !msg.deleted_at).map((msg) => {
            const mine = isMyMessage(msg);
            const parent = msg.reply_to ? messages.find((m) => m.id === msg.reply_to) : null;
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
                      {!parent.content && parent.attachment_url && (
                        <div className="text-xs text-gray-700">📎 Attachment</div>
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
                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className={`mt-1 block text-xs underline ${mine ? "text-blue-100" : "text-blue-600"}`}>View Attachment</a>
                  )}
                  <span className={`mt-1 block text-[10px] ${mine ? "text-blue-100" : "text-gray-500"} text-right`}>
                    {new Date(msg.created_at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    })}
                  </span>
                  <div className="relative mt-2 flex justify-end" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                      className={`rounded p-1 hover:bg-gray-300/30 transition ${mine ? "hover:bg-blue-500/30" : ""}`}
                    >
                      <MoreVertical size={16} className={mine ? "text-blue-100" : "text-gray-600"} />
                    </button>
                    {openMenuId === msg.id && (
                      <div className="absolute right-0 top-6 z-50 min-w-max rounded-lg border border-gray-300 bg-white shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTarget(msg);
                            setOpenMenuId(null);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Reply
                        </button>
                        {mine && (
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteMessage(msg.id);
                              setOpenMenuId(null);
                            }}
                            disabled={deletingMessageId === msg.id}
                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                        {!mine && (
                          <button
                            type="button"
                            onClick={() => {
                              setReportingMessage(msg);
                              setOpenMenuId(null);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50"
                          >
                            Report
                          </button>
                        )}
                      </div>
                    )}
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
                {!replyTarget.content && replyTarget.attachment_url && (
                  <div className="text-xs text-gray-600">📎 Attachment</div>
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

      {/* Report Modal */}
      {reportingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Report Message</h2>
            </div>
            <form onSubmit={handleReportSubmit} className="space-y-4 p-6">
              <div>
                <p className="mb-2 text-sm text-gray-600">Message to report:</p>
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-3">
                  <p className="text-sm text-gray-800">{reportingMessage.content}</p>
                </div>
              </div>
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for reporting
                </label>
                <select
                  id="reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason...</option>
                  <option value="offensive">Offensive or hateful</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  id="description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Tell us more about this report..."
                  rows="3"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReportingMessage(null);
                    setReportReason("");
                    setReportDescription("");
                  }}
                  disabled={reportSubmitting}
                  className="flex-1 rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting || !reportReason}
                  className="flex-1 rounded-lg bg-red-600 py-2 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {reportSubmitting ? "Reporting..." : "Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
