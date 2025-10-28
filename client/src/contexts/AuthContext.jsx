import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // auth session loading

  // Preloaded user-related data to avoid refetching on every page
  const [profile, setProfile] = useState(null); // student record from students table
  const [userModules, setUserModules] = useState(null); // array of modules the user has
  const [preloading, setPreloading] = useState(false); // whether we're preloading profile/modules

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
      setLoading(false); // ✅ done loading
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        // When a user signs in, preload their profile and modules for the session
        if (currentUser) {
          preloadUserData(currentUser);
        } else {
          // cleared session -> reset preloaded data
          setProfile(null);
          setUserModules(null);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Preload user profile and modules (once per session after login)
  const preloadUserData = async (authUser) => {
    if (!authUser) return;
    try {
      setPreloading(true);

      // Fetch student record
      const { data: dbUser, error: userErr } = await supabase
        .from("students")
        .select(
          "id, displayname, email, profileimage, canreview, review, suggestion, courseid, userid",
        )
        .eq("userid", authUser.id)
        .maybeSingle();

      if (userErr) throw userErr;
      if (dbUser) setProfile(dbUser);

      // Fetch user modules with module details
      const { data: moduleData, error: modErr } = await supabase
        .from("user_modules")
        .select(`moduleid, modules:moduleid (id, name, code)`)
        .eq("userid", dbUser?.id);

      if (modErr) {
        console.warn("Failed to preload user modules:", modErr.message);
      } else {
        const formatted = moduleData?.map((m) => m.modules) || [];
        setUserModules(formatted);
      }
    } catch (err) {
      console.warn("Preload error:", err.message);
    } finally {
      setPreloading(false);
    }
  };

  // If a session was already present on mount, kick off preload
  useEffect(() => {
    if (user) preloadUserData(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading authentication...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        profile,
        setProfile,
        userModules,
        setUserModules,
        preloading,
        preloadUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
