import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Send, Paperclip } from "lucide-react";

export default function ModuleChat() {
  const { moduleId } = useParams();
  const { user, profile, userModules } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [moduleInfo, setModuleInfo] = useState(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  // If userModules are preloaded we can determine access synchronously
  const initialAllowed = userModules ? Boolean(userModules.some((m) => String(m.id) === String(moduleId))) : null;
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
          setStudent({ id: profile.id, displayname: profile.displayname, profileimage: profile.profileimage });

          // Check access via preloaded userModules if available
          if (userModules) {
            const has = userModules.some((m) => String(m.id) === String(moduleId));
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

          if (studentError || !studentData) throw new Error("Student not found");
          setStudent(studentData);

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

          if (modError) console.warn("Failed to load module details:", modError.message);
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
          `
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
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
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

      // Insert message
      const { error: insertError } = await supabase.from("messages").insert([
        {
          moduleid: moduleId,
          userid: student.id,
          content,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
        },
      ]);

      if (insertError) {
        console.error("Insert error:", insertError.message);
        alert("Error sending message: " + insertError.message);
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
      <div className="flex items-center justify-center h-screen text-gray-500 bg-gray-100">
        Checking access…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-900 text-center px-6">
        <h2 className="text-2xl font-semibold mb-2">Access Denied 🚫</h2>
        <p className="text-gray-600 mb-6 max-w-sm">You don't have access to this module's chat.</p>
        <button
          onClick={() => navigate("/home")}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full transition"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen  text-gray-900 font-inter  ">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b bg-gray-100  shadow-sm">
        <button onClick={() => navigate("/home") } className="text-gray-500 hover:text-gray-700 mr-3">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold">{moduleInfo?.name ? moduleInfo.name : `Module ${moduleId}`}</h1>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-150px)] bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">Start the conversation 💬</p>
        ) : (
          messages.map((msg) => {
            const mine = isMyMessage(msg);
            return (
              <div key={msg.id} className={`flex items-end ${mine ? "justify-end" : "justify-start"}`}>
                {!mine &&
                  (msg.students?.profileimage ? (
                    <img src={msg.students.profileimage} alt="" className="w-9 h-9 rounded-full mr-2 border border-gray-300" />
                  ) : (
                    <div className="w-9 h-9 rounded-full mr-2 border border-gray-300 bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-lg">{(msg.students?.displayname || "U")[0].toUpperCase()}</div>
                  ))}
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm  ${mine ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-200 text-gray-800 rounded-bl-none"}`}>
                  {!mine && <span className="block text-xs text-gray-500 mb-1 ">{msg.students?.displayname || "User"}</span>}
                  {msg.content && <p className="text-sm  font-medium ">{msg.content}</p>}
                  {msg.attachment_url && (
                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className={`block mt-1 text-xs underline ${mine ? "text-blue-100" : "text-blue-600"}`}>
                      {msg.attachment_name || "View Attachment"}
                    </a>
                  )}

                  <span className={`block text-[10px] mt-1 ${mine ? "text-blue-100" : "text-gray-500"} text-right`}>
                    {new Date(msg.created_at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    })}
                  </span>
                </div>
                {mine &&
                  (student?.profileimage ? (
                    <img src={student.profileimage} alt="" className="w-9 h-9 rounded-full ml-2 border border-gray-300" />
                  ) : (
                    <div className="w-9 h-9 rounded-full ml-2 border border-gray-300 bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-lg">{(student?.displayname || "U")[0].toUpperCase()}</div>
                  ))}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="p-4 flex items-center w-full justify-between  h-[100px] bg-gray-100">
        {/* Input Bar */}

        <form onSubmit={handleSend} className="flex items-center justify-between   space-x-4  w-full h-full ">
          <label htmlFor="file-input" className="cursor-pointer text-gray-500 hover:text-gray-700">
            <Paperclip size={20} />
            <input id="file-input" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </label>
          <input
            type="text"
            placeholder="Type a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="p-2 rounded-full bg-white border border-gray-300 w-[calc(80%-2rem)] focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button type="submit" disabled={sending} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3 flex justify-center items-center transition disabled:opacity-50 ">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

