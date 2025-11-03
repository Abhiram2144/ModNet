import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Send, Paperclip, Loader2 } from "lucide-react";

export default function ModuleChat() {
  const { moduleId } = useParams();
  const { user, profile, userModules } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [moduleInfo, setModuleInfo] = useState(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [sending, setSending] = useState(false);
  // If userModules are preloaded we can determine access synchronously
  const initialAllowed = userModules
    ? Boolean(userModules.some((m) => String(m.id) === String(moduleId)))
    : null;
  const [allowed, setAllowed] = useState(initialAllowed);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchStudentAndCheckAccess = async () => {
      try {
        // If profile preloaded, use it
        if (profile) {
          setStudent({
            id: profile.id,
            authid: profile.userid,
            displayname: profile.displayname,
            profileimage: profile.profileimage,
          });

          // Check access via preloaded userModules if available
          if (userModules) {
            const has = userModules.some(
              (m) => String(m.id) === String(moduleId),
            );
            setAllowed(Boolean(has));
          } else {
            const { data: access, error: accessError } = await supabase
              .from("user_modules")
              .select("id")
              .eq("userid", profile.id)
              .eq("moduleid", moduleId)
              .maybeSingle();

            if (accessError) throw accessError;
            setAllowed(Boolean(access));
          }
        } else {
          const { data: studentData, error: studentError } = await supabase
            .from("students")
            .select("id, displayname, profileimage")
            .eq("userid", user.id)
            .maybeSingle();

          if (studentError || !studentData)
            throw new Error("Student not found");
          setStudent({ ...studentData, authid: user.id });

          const { data: access, error: accessError } = await supabase
            .from("user_modules")
            .select("id")
            .eq("userid", studentData.id)
            .eq("moduleid", moduleId)
            .maybeSingle();

          if (accessError) throw accessError;
          if (!access) {
            setAllowed(false);
            return;
          }

          setAllowed(true);
        }

        // Fetch module info for header
        try {
          const { data: mod, error: modError } = await supabase
            .from("modules")
            .select("id, name")
            .eq("id", moduleId)
            .maybeSingle();

          if (modError)
            console.warn("Failed to load module details:", modError.message);
          else if (mod) setModuleInfo(mod);
        } catch (err) {
          console.warn("Error fetching module details:", err.message);
        }

        // Fetch messages
        const { data: msgs, error: msgError } = await supabase
          .from("messages")
          .select(
            `
            id, created_at, content, attachment_url, attachment_name, userid,
            students:userid (displayname, profileimage)
          `,
          )
          .eq("moduleid", moduleId)
          .order("created_at", { ascending: true });

        if (msgError) throw msgError;
        setMessages(msgs || []);

        const channel = supabase
          .channel(`chat-${moduleId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `moduleid=eq.${moduleId}`,
            },
            async (payload) => {
              const newRow = payload.new;

              // If the realtime payload already contains joined students info, use it.
              if (newRow.students && (newRow.students.displayname || newRow.students.profileimage)) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === newRow.id)) return prev;
                  return [...prev, newRow];
                });
                return;
              }

              // Otherwise, try to fetch the full message row (with joined students) by id.
              try {
                const { data: fullMsg, error: fullErr } = await supabase
                  .from("messages")
                  .select(
                    `id, created_at, content, attachment_url, attachment_name, userid, students:userid (displayname, profileimage)`
                  )
                  .eq("id", newRow.id)
                  .maybeSingle();

                if (fullErr) throw fullErr;
                if (fullMsg) {
                  setMessages((prev) => {
                    if (prev.some((m) => m.id === fullMsg.id)) return prev;
                    return [...prev, fullMsg];
                  });
                  return;
                }
              } catch (err) {
                console.warn("Failed to fetch full message for realtime insert:", err?.message || err);
              }

              // Fallback: try to fetch the student row and attach it to the payload
              try {
                const { data: studentRow } = await supabase
                  .from("students")
                  .select("displayname, profileimage")
                  .eq("id", newRow.userid)
                  .maybeSingle();

                const enriched = { ...newRow, students: studentRow || null };
                setMessages((prev) => {
                  if (prev.some((m) => m.id === enriched.id)) return prev;
                  return [...prev, enriched];
                });
                return;
              } catch (err) {
                console.warn("Failed to fetch student for realtime message:", err?.message || err);
              }

              // As a last resort, append the raw payload (deduped)
              setMessages((prev) => {
                if (prev.some((m) => m.id === newRow.id)) return prev;
                return [...prev, newRow];
              });
            }
          )
          .subscribe();

        return () => supabase.removeChannel(channel);
      } catch (err) {
        console.error("Error loading chat:", err.message);
        setAllowed(false);
      }
    };

    fetchStudentAndCheckAccess();
  }, [user, moduleId, navigate, profile, userModules]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setSending(true);

    try {
      let attachmentUrl = null;
      let attachmentName = null;

      // Upload file if present
      if (file) {
        const fileExt = file.name.split(".").pop();
        const uniqueName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${uniqueName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError.message);
          alert("Failed to upload file: " + uploadError.message);
          setSending(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(uploadData.path);

        attachmentUrl = publicUrlData.publicUrl;
        attachmentName = file.name;
      }

      // Insert message and return the inserted row so we can render it immediately
      const payload = {
        moduleid: moduleId,
        // messages.userid must reference students.id (the students PK).
        // Prefer the student's `id` (uuid) — not the Supabase auth id.
        userid: student?.id,
        content,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      };

      const { data: insertedMsg, error: insertError } = await supabase
        .from("messages")
        .insert([payload])
        .select(
          `id, created_at, content, attachment_url, attachment_name, userid, students:userid (displayname, profileimage)`,
        )
        .maybeSingle();

      if (insertError) {
        console.error("Insert error:", insertError.message);
        alert("Error sending message: " + insertError.message);
      } else if (insertedMsg) {
        // append the inserted message immediately (avoid waiting for realtime)
        setMessages((prev) => [...prev, insertedMsg]);
      }

      setContent("");
      setFile(null);
    } catch (err) {
      console.error("Error:", err.message);
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (msg) => msg.userid === student?.id;

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
        <p className="mb-6 max-w-sm text-gray-600">
          You don't have access to this module's chat.
        </p>
        <button
          onClick={() => navigate("/home")}
          className="rounded-full bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-500"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="font-inter flex flex-col text-gray-900 h-[100dvh] max-h-[100dvh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3 shadow-sm flex-shrink-0 h-16 min-h-16 max-h-16 bg-white z-10">
        <button
          onClick={() => navigate("/home")}
          className="mr-3 text-gray-500 hover:cursor-pointer hover:text-gray-700"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="truncate text-lg font-semibold">
          {moduleInfo?.name ? moduleInfo.name : `Module ${moduleId}`}
        </h1>
      </div>

      {/* Chat Area */}
  <div className="scrollbar-thin scrollbar-thumb-gray-300 flex-1 min-h-0 space-y-4 overflow-y-auto bg-gray-50 p-4">
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-gray-500">
            Start the conversation 💬
          </p>
        ) : (
          messages.map((msg) => {
            const mine = isMyMessage(msg);
            return (
              <div
                key={msg.id}
                className={`flex items-end ${
                  mine ? "justify-end" : "justify-start"
                }`}
              >
                {!mine &&
                  (msg.students?.profileimage ? (
                    <img
                      src={msg.students.profileimage}
                      alt=""
                      className="mr-2 h-9 w-9 rounded-full border border-gray-300"
                    />
                  ) : (
                    <div className="mr-2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-gray-300 text-lg font-bold text-gray-700">
                      {(msg.students?.displayname || "U")[0].toUpperCase()}
                    </div>
                  ))}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                    mine
                      ? "rounded-br-none bg-blue-600 text-white"
                      : "rounded-bl-none bg-gray-200 text-gray-800"
                  }`}
                >
                  {!mine && (
                    <span className="mb-1 block text-xs text-gray-500">
                      {msg.students?.displayname || "User"}
                    </span>
                  )}
                  {msg.content && (
                    <p className="text-sm font-medium">{msg.content}</p>
                  )}
                  {msg.attachment_url && (
                    <a
                      href={msg.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-1 block text-xs underline ${
                        mine ? "text-blue-100" : "text-blue-600"
                      }`}
                    >
                      {msg.attachment_name || "View Attachment"}
                    </a>
                  )}

                  <span
                    className={`mt-1 block text-[10px] ${
                      mine ? "text-blue-100" : "text-gray-500"
                    } text-right`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone:
                        Intl.DateTimeFormat().resolvedOptions().timeZone,
                    })}
                  </span>
                </div>
                {mine &&
                  (student?.profileimage ? (
                    <img
                      src={student.profileimage}
                      alt=""
                      className="ml-2 h-9 w-9 rounded-full border border-gray-300"
                    />
                  ) : (
                    <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-gray-300 text-lg font-bold text-gray-700">
                      {(student?.displayname || "U")[0].toUpperCase()}
                    </div>
                  ))}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="flex-shrink-0 w-full bg-gray-100 p-4 z-10">
        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex w-full flex-col space-y-2">
          {/* Selected file preview / full-width chip above the input so it doesn't shrink the text field */}
          {file && (
            <div className="flex w-full flex-col space-y-1">
              <div className="flex items-center justify-between w-full rounded-lg bg-white px-3 py-2 border border-gray-300">
                <div className="flex items-center space-x-3">
                  <Paperclip size={16} className="text-gray-600" />
                  <div className="text-sm font-medium text-gray-800 truncate max-w-[60vw]">
                    {file.name}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setFileError(""); }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                    aria-label="Remove attached file"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {fileError && (
                <div className="text-sm text-red-600">{fileError}</div>
              )}
            </div>
          )}

          <div className="flex w-full items-center space-x-3">
            <label
              htmlFor="file-input"
              className={`cursor-pointer text-gray-500 hover:text-gray-700 ${sending ? "pointer-events-none opacity-50" : ""}`}
              title={file ? "Remove current file to attach a new one" : "Attach a file"}
            >
              <Paperclip size={20} />
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={(e) => {
                  // Only accept one file at a time. If one is already present, show an error message.
                  if (!e.target.files || e.target.files.length === 0) return;
                  if (file) {
                    setFileError("Only one file can be attached at a time. Remove the current file to attach another.");
                    setTimeout(() => setFileError(""), 3500);
                    // reset input value so selecting the same file again triggers change next time
                    e.target.value = null;
                    return;
                  }
                  setFile(e.target.files[0]);
                }}
              />
            </label>

            <input
              type="text"
              placeholder="Type a message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 rounded-full border border-gray-300 bg-white p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />

            <button
              type="submit"
              disabled={sending}
              className="bg-primary flex items-center justify-center rounded-full p-3 text-white transition disabled:opacity-50"
            >
              {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
