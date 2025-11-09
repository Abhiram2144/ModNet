import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Users, MoreHorizontal } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

// Color badges for icons (rotate for variety)
const COLOR_CLASSES = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
];

export default function Discover() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Server data
  const [channels, setChannels] = useState([]); // all available channels (public + private)
  const [joinedIds, setJoinedIds] = useState(new Set()); // Set<string> channel ids the user has joined
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(null); // channel id being joined/left
  const [error, setError] = useState(null);

  // Load channels and membership (Option A: normalized channels + channel_members)
  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return; // wait for profile
      setLoading(true);
      setError(null);
      try {
        // Try to load channels with is_private split (private clubs stored on channels.is_private)
        try {
          const { data: ch, error: chErr } = await supabase
            .from("channels")
            .select("id, name, description, is_private")
            .order("name", { ascending: true });
          if (chErr) throw chErr;
          // keep all channels in one list; we'll mark private ones with is_private
          setChannels(ch || []);
        } catch (e) {
          // Fallback: load channels without is_private (treat as public)
          const { data: ch, error: chErr } = await supabase
            .from("channels")
            .select("id, name, description")
            .order("name", { ascending: true });
          if (chErr) throw chErr;
          const fallback = (ch || []).map((c) => ({ ...c, is_private: false }));
          setChannels(fallback);
        }

        // Fetch membership for current student
        const { data: mem, error: memErr } = await supabase
          .from("channel_members")
          .select("channel_id")
          .eq("student_id", profile.id);
        if (memErr) throw memErr;

        setJoinedIds(new Set((mem || []).map((m) => m.channel_id)));
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id]);

  const myChats = useMemo(
    () => channels.filter((c) => joinedIds.has(c.id)).map((c, idx) => ({
      ...c,
      _displayTitle: c.name || "Untitled",
      _displayDesc: c.description || "",
      _isPrivate: !!c.is_private,
      _color: COLOR_CLASSES[idx % COLOR_CLASSES.length],
    })),
    [channels, joinedIds],
  );

  const otherChats = useMemo(
    // Only include public channels that the user hasn't joined. Private channels are not shown here.
    () => channels.filter((c) => !joinedIds.has(c.id) && !c.is_private).map((c, idx) => ({
      ...c,
      _displayTitle: c.name || "Untitled",
      _displayDesc: c.description || "",
      _color: COLOR_CLASSES[idx % COLOR_CLASSES.length],
    })),
    [channels, joinedIds],
  );

  const joinChannel = async (channelId) => {
    if (!profile?.id) return;
    try {
      setMutating(channelId);
      const { error: err } = await supabase
        .from("channel_members")
        .insert({ channel_id: channelId, student_id: profile.id });
      if (err) throw err;
      setJoinedIds((prev) => new Set(prev).add(channelId));
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setMutating(null);
    }
  };

  const leaveChannel = async (channelId) => {
    if (!profile?.id) return;
    try {
      setMutating(channelId);
      const { error: err } = await supabase
        .from("channel_members")
        .delete()
        .match({ channel_id: channelId, student_id: profile.id });
      if (err) throw err;
      setJoinedIds((prev) => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setMutating(null);
    }
  };

  // Mini-menu state for three-dots action on joined chats
  const [openMenu, setOpenMenu] = useState(null); // stores the key of the group with an open menu
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!openMenu) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenu]);

  return (
    <div className="font-inter">
      <Navbar />
      <div className="min-h-screen bg-[#F2EFE8] text-black pt-16 pb-20 px-4">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-semibold mb-2">Discover</h1>
          <p className="text-sm text-gray-600 mb-4">Join open groups to connect with others. You can leave anytime.</p>

          {error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>
          )}

          {/* My Chats */}
          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">My chats</h2>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-600">
                Loading channels…
              </div>
            ) : myChats.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-600">
                Join your first chat to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {myChats.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start">
                      <button
                        type="button"
                        className={`mr-3 rounded-lg p-2 ${c._color}`}
                        onClick={() => navigate(`/discover/chat/${c.id}`)}
                        title={`Open ${c._displayTitle}`}
                      >
                        <Users size={18} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <div className="pr-3">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/discover/chat/${c.id}`)}
                                className="text-left text-base font-semibold hover:underline"
                              >
                                {c._displayTitle}
                              </button>
                              {c._isPrivate && (
                                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">Private</span>
                              )}
                            </div>
                            {c._displayDesc && (
                              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{c._displayDesc}</p>
                            )}
                          </div>
                          <div className="relative">
                            <button
                              type="button"
                              className="rounded-full p-1 text-gray-600 hover:bg-gray-100"
                              onClick={() => setOpenMenu((curr) => (curr === c.id ? null : c.id))}
                              title="Options"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            {openMenu === c.id && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                              >
                                <button
                                  type="button"
                                  className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                                  onClick={async () => {
                                    await leaveChannel(c.id);
                                    setOpenMenu(null);
                                  }}
                                >
                                  Exit group
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* (Private channels are shown in My chats / Other chats with a badge) */}

          {/* Other Chats */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Other chats</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {loading ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-3 text-center text-sm text-gray-600">
                  Loading…
                </div>
              ) : otherChats.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-600">
                  You're in all available chats.
                </div>
              ) : (
                otherChats.map((c) => (
                <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start">
                    <div className={`mr-3 rounded-lg p-2 ${c._color}`}>
                      <Users size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-semibold">{c._displayTitle}</h3>
                          {c._isPrivate && (
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">Private</span>
                          )}
                        </div>
                        {c._isPrivate ? (
                          <button className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 cursor-not-allowed" title="Private channel">Private</button>
                        ) : (
                          <button
                            onClick={() => joinChannel(c.id)}
                            disabled={mutating === c.id}
                            className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {mutating === c.id ? "Joining…" : "Join"}
                          </button>
                        )}
                      </div>
                      {c._displayDesc && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{c._displayDesc}</p>
                      )}
                    </div>
                  </div>
                </div>
              )))
              }
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
