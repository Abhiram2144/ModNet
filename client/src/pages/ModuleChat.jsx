import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
// import { ArrowLeft, Send, Paperclip, Loader2 } from "lucide-react";

import ChatContainer from "../components/ChatContainer";

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
  const [replyTarget, setReplyTarget] = useState(null);
  const [sending, setSending] = useState(false);
  // If userModules are preloaded we can determine access synchronously
  const initialAllowed = userModules
    ? Boolean(userModules.some((m) => String(m.id) === String(moduleId)))
    : null;
  const [allowed, setAllowed] = useState(initialAllowed);
  const messagesEndRef = useRef(null);
  const isFirstLoadRef = useRef(true); // to jump to bottom immediately on initial load
  const lastSeenRef = useRef(null); // latest created_at we've seen (for polling fallback)

  const scrollToBottom = (behavior = "smooth") => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior });
    } catch (e) {}
  };

  useEffect(() => {
    if (isFirstLoadRef.current) {
      // Jump immediately on first render to avoid visible scroll-from-top flicker
      scrollToBottom("auto");
      isFirstLoadRef.current = false;
    } else {
      scrollToBottom("smooth");
    }
  }, [messages]);

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
            id, created_at, content, attachment_url, attachment_name, userid, reply_to_id,
            students:userid (displayname, profileimage)
          `,
          )
          .eq("moduleid", moduleId)
          .order("created_at", { ascending: true });

        if (msgError) throw msgError;
        setMessages(msgs || []);
        if (msgs && msgs.length > 0) {
          lastSeenRef.current = msgs[msgs.length - 1].created_at;
        }

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
              if (
                newRow.students &&
                (newRow.students.displayname || newRow.students.profileimage)
              ) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === newRow.id)) return prev;
                  const next = [...prev, newRow];
                  try {
                    lastSeenRef.current =
                      newRow.created_at || lastSeenRef.current;
                  } catch {}
                  return next;
                });
                return;
              }

              // Otherwise, try to fetch the full message row (with joined students) by id.
              try {
                const { data: fullMsg, error: fullErr } = await supabase
                  .from("messages")
                  .select(
                    `id, created_at, content, attachment_url, attachment_name, userid, reply_to_id, students:userid (displayname, profileimage)`,
                  )
                  .eq("id", newRow.id)
                  .maybeSingle();

                if (fullErr) throw fullErr;
                if (fullMsg) {
                  setMessages((prev) => {
                    if (prev.some((m) => m.id === fullMsg.id)) return prev;
                    const next = [...prev, fullMsg];
                    try {
                      lastSeenRef.current =
                        fullMsg.created_at || lastSeenRef.current;
                    } catch {}
                    return next;
                  });
                  return;
                }
              } catch (err) {
                console.warn(
                  "Failed to fetch full message for realtime insert:",
                  err?.message || err,
                );
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
                  const next = [...prev, enriched];
                  try {
                    lastSeenRef.current =
                      enriched.created_at || lastSeenRef.current;
                  } catch {}
                  return next;
                });
                return;
              } catch (err) {
                console.warn(
                  "Failed to fetch student for realtime message:",
                  err?.message || err,
                );
              }

              // As a last resort, append the raw payload (deduped)
              setMessages((prev) => {
                if (prev.some((m) => m.id === newRow.id)) return prev;
                const next = [...prev, newRow];
                try {
                  lastSeenRef.current =
                    newRow.created_at || lastSeenRef.current;
                } catch {}
                return next;
              });
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              // console.debug(`Realtime subscribed to chat-${moduleId}`);
            }
          });

        return () => supabase.removeChannel(channel);
      } catch (err) {
        console.error("Error loading chat:", err.message);
        setAllowed(false);
      }
    };

    fetchStudentAndCheckAccess();
  }, [user, moduleId, navigate, profile, userModules]);

  // Polling fallback: in case Realtime is disabled or blocked by network/policies, fetch new messages periodically
  useEffect(() => {
    let timer;
    if (allowed) {
      timer = setInterval(async () => {
        try {
          const since = lastSeenRef.current;
          let query = supabase
            .from("messages")
            .select(
              `id, created_at, content, attachment_url, attachment_name, userid, reply_to_id, students:userid (displayname, profileimage)`,
            )
            .eq("moduleid", moduleId)
            .order("created_at", { ascending: true });

          if (since) {
            query = query.gt("created_at", since);
          }

          const { data: newer, error: newerErr } = await query;
          if (newerErr) return;
          if (newer && newer.length) {
            setMessages((prev) => {
              const have = new Set(prev.map((m) => m.id));
              const merged = [...prev, ...newer.filter((m) => !have.has(m.id))];
              try {
                lastSeenRef.current =
                  merged[merged.length - 1]?.created_at || lastSeenRef.current;
              } catch {}
              return merged;
            });
          }
        } catch {}
      }, 3000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [allowed, moduleId]);

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
        reply_to_id: replyTarget?.id || null,
        content,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      };

      const { data: insertedMsg, error: insertError } = await supabase
        .from("messages")
        .insert([payload])
        .select(
          `id, created_at, content, attachment_url, attachment_name, userid, reply_to_id, students:userid (displayname, profileimage)`,
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
      setReplyTarget(null);
      setFile(null);
    } catch (err) {
      console.error("Error:", err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <ChatContainer
      chatType="module"
      chatId={moduleId}
      user={user}
      profile={profile}
      student={student}
      allowed={allowed}
      setAllowed={setAllowed}
      chatInfo={moduleInfo}
      setChatInfo={setModuleInfo}
      messages={messages}
      setMessages={setMessages}
      content={content}
      setContent={setContent}
      file={file}
      setFile={setFile}
      fileError={fileError}
      setFileError={setFileError}
      replyTarget={replyTarget}
      setReplyTarget={setReplyTarget}
      sending={sending}
      setSending={setSending}
      messagesEndRef={messagesEndRef}
      lastSeenRef={lastSeenRef}
      handleSend={handleSend}
      navigate={navigate}
      headerTitle={moduleInfo?.name ? moduleInfo.name : `Module ${moduleId}`}
      deniedText={"You don't have access to this module's chat."}
      deniedButtonText={"Go Back Home"}
      deniedButtonLink={"/home"}
    />
  );
}
