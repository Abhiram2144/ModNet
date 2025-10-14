import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Send, Paperclip } from "lucide-react";

export default function ModuleChat() {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [allowed, setAllowed] = useState(null); // 🔒 Access control state
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
        // 1️⃣ Get student internal ID
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, displayname, profileimage")
          .eq("userid", user.id)
          .maybeSingle();

        if (studentError || !studentData) throw new Error("Student not found");
        setStudent(studentData);

        // 2️⃣ Verify module access
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

        // 3️⃣ Fetch existing messages
        const { data: msgs, error: msgError } = await supabase
          .from("messages")
          .select(`
            id, created_at, content, attachment_url, userid,
            students:userid (displayname, profileimage)
          `)
          .eq("moduleid", moduleId)
          .order("created_at", { ascending: true });

        if (msgError) throw msgError;
        setMessages(msgs || []);

        // 4️⃣ Subscribe to real-time updates
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
            (payload) => {
              setMessages((prev) => [...prev, payload.new]);
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
  }, [user, moduleId, navigate]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setSending(true);

    let attachmentUrl = null;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(fileName, file);

      if (!uploadError) {
        const { data: publicUrl } = supabase.storage
          .from("attachments")
          .getPublicUrl(uploadData.path);
        attachmentUrl = publicUrl.publicUrl;
      }
    }

    await supabase.from("messages").insert([
      {
        moduleid: moduleId,
        userid: student.id,
        content,
        attachment_url: attachmentUrl,
      },
    ]);

    setContent("");
    setFile(null);
    setSending(false);
  };

  const isMyMessage = (msg) => msg.userid === student?.id;

  // 🔒 While checking access
  if (allowed === null) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 bg-neutral-950">
        Checking access…
      </div>
    );
  }

  // 🚫 Access denied screen
  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-white text-center px-6">
        <h2 className="text-2xl font-bold mb-2">Access Denied 🚫</h2>
        <p className="text-gray-400 mb-6 max-w-sm">
          You don’t have access to this module’s chat.
        </p>
        <button
          onClick={() => navigate("/home")}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  // ✅ Authorized user UI
  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-neutral-800 bg-neutral-900">
        <button
          onClick={() => navigate("/home")}
          className="text-gray-400 hover:text-white mr-3"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Module {moduleId}</h1>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-neutral-900">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const mine = isMyMessage(msg);
            return (
              <div
                key={msg.id}
                className={`flex w-full ${
                  mine ? "justify-end" : "justify-start"
                }`}
              >
                {!mine && (
                  <img
                    src={msg.students?.profileimage || "/default-avatar.png"}
                    alt=""
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}

                <div
                  className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-md ${
                    mine
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-neutral-800 text-gray-100 rounded-bl-none"
                  }`}
                >
                  {!mine && (
                    <span className="block text-xs text-gray-400 mb-1">
                      {msg.students?.displayname || "User"}
                    </span>
                  )}
                  {msg.content && <p>{msg.content}</p>}
                  {msg.attachment_url && (
                    <a
                      href={msg.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block mt-1 text-blue-300 underline text-xs"
                    >
                      View Attachment
                    </a>
                  )}
                  <span className="block text-[10px] text-gray-400 mt-1 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {mine && (
                  <img
                    src={student?.profileimage || "/default-avatar.png"}
                    alt=""
                    className="w-8 h-8 rounded-full ml-2"
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 bg-neutral-900 border-t border-neutral-800"
      >
        <label htmlFor="file-input" className="cursor-pointer text-gray-400">
          <Paperclip size={20} />
          <input
            id="file-input"
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        <input
          type="text"
          placeholder="Enter your message"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-neutral-800 rounded-full px-4 py-2 text-sm outline-none placeholder-gray-500 text-white"
        />

        <button
          type="submit"
          disabled={sending}
          className="bg-blue-600 hover:bg-blue-500 rounded-full p-2 transition disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
