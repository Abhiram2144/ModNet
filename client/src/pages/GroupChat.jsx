import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

import ChatContainer from "../components/ChatContainer";

export default function GroupChat() {
  // Note: param name remains `key` in routes, but it now holds the channel id
  const { key: channelId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [student, setStudent] = useState(null);
  const [allowed, setAllowed] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const lastSeenRef = useRef(null);

  const isFirstLoadRef = useRef(true);
  const scrollToBottom = (behavior = "smooth") => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior });
    } catch (e) {}
  };

  useEffect(() => {
    if (isFirstLoadRef.current) {
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

    const init = async () => {
      try {
        // Resolve current student id and basic profile (prefer preloaded)
        let studentId = profile?.id;
        if (profile) {
          setStudent({
            id: profile.id,
            authid: profile.userid,
            displayname: profile.displayname,
            profileimage: profile.profileimage,
          });
        } else {
          const { data: studentData, error: studentError } = await supabase
            .from("students")
            .select("id, displayname, profileimage")
            .eq("userid", user.id)
            .maybeSingle();
          if (studentError || !studentData)
            throw new Error("Student not found");
          setStudent({ ...studentData, authid: user.id });
          studentId = studentData.id;
        }
        if (!studentId) throw new Error("No student id");

        // Check membership
        const { data: memRows, error: memErr } = await supabase
          .from("channel_members")
          .select("id")
          .eq("channel_id", channelId)
          .eq("student_id", studentId)
          .limit(1);
        if (memErr) throw memErr;
        setAllowed((memRows?.length || 0) > 0);

        // Channel details
        const { data: ch, error: chErr } = await supabase
          .from("channels")
          .select("id, name, description")
          .eq("id", channelId)
          .maybeSingle();
        if (!chErr && ch) setChannelInfo(ch);

        // Messages
        const { data: msgs, error: msgErr } = await supabase
          .from("group_messages")
          .select(
            `id, created_at, content, attachment_url, attachment_name, userid, reply_to_id,
             students:userid (displayname, profileimage)`,
          )
          .eq("channel_id", channelId)
          .order("created_at", { ascending: true });
        if (msgErr) throw msgErr;
        setMessages(msgs || []);
        if (msgs?.length)
          lastSeenRef.current = msgs[msgs.length - 1].created_at;

        // Realtime
        const channel = supabase
          .channel(`group-chat-${channelId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "group_messages",
              filter: `channel_id=eq.${channelId}`,
            },
            async (payload) => {
              const newRow = payload.new;
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

              try {
                const { data: fullMsg } = await supabase
                  .from("group_messages")
                  .select(
                    `id, created_at, content, attachment_url, attachment_name, userid, reply_to_id, students:userid (displayname, profileimage)`,
                  )
                  .eq("id", newRow.id)
                  .maybeSingle();
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
              } catch {}

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
              } catch {}

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
          .subscribe();

        return () => supabase.removeChannel(channel);
      } catch (err) {
        console.error("Error loading group chat:", err?.message || err);
        setAllowed(false);
      }
    };

    init();
  }, [user, profile, channelId, navigate]);

  // Polling fallback
  useEffect(() => {
    let timer;
    if (allowed) {
      timer = setInterval(async () => {
        try {
          const since = lastSeenRef.current;
          let query = supabase
            .from("group_messages")
            .select(
              `id, created_at, content, attachment_url, attachment_name, userid, reply_to_id, students:userid (displayname, profileimage)`,
            )
            .eq("channel_id", channelId)
            .order("created_at", { ascending: true });

          if (since) query = query.gt("created_at", since);

          const { data: newer } = await query;
          if (newer?.length) {
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
  }, [allowed, channelId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setSending(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${uniqueName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) {
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

      const payload = {
        channel_id: channelId,
        userid: student?.id, // students.id
        reply_to_id: replyTarget?.id || null,
        content,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      };

      const { data: insertedMsg, error: insertError } = await supabase
        .from("group_messages")
        .insert([payload])
        .select(
          `id, created_at, content, attachment_url, attachment_name, userid, reply_to_id, students:userid (displayname, profileimage)`,
        )
        .maybeSingle();

      if (insertError) {
        alert("Error sending message: " + insertError.message);
      } else if (insertedMsg) {
        setMessages((prev) => [...prev, insertedMsg]);
      }

      setContent("");
      setReplyTarget(null);
      setFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <ChatContainer
      chatType="group"
      chatId={channelId}
      user={user}
      profile={profile}
      student={student}
      allowed={allowed}
      setAllowed={setAllowed}
      chatInfo={channelInfo}
      setChatInfo={setChannelInfo}
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
      headerTitle={channelInfo?.name || "Group"}
      deniedText={"You don't have access to this group's chat."}
      deniedButtonText={"Back to Discover"}
      deniedButtonLink={"/discover"}
    />
  );
}
