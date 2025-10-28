import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { FaEdit } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import Modal from "../components/Modal";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

const AccountPage = () => {
  const [userData, setUserData] = useState(null);
  const [modules, setModules] = useState([]);
  const { profile, userModules, setProfile } = useAuth();
  // if profile is already preloaded, don't show the loader
  const [loading, setLoading] = useState(!profile);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const PFPS = import.meta.env.VITE_PFPS
    ? JSON.parse(import.meta.env.VITE_PFPS)
    : [];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // If profile was preloaded in context, use it
        if (profile) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("name")
            .eq("id", profile.courseid)
            .single();

          setUserData({
            ...profile,
            courseName: courseData?.name || "No course selected",
          });

          if (userModules) setModules(userModules.map((m) => m.name));
          else {
            const { data: moduleData } = await supabase
              .from("user_modules")
              .select("moduleid, modules(name)")
              .eq("userid", profile.id);
            setModules(moduleData?.map((m) => m.modules.name) || []);
          }
        } else {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("User not found.");

          const { data: dbUser, error: userErr } = await supabase
            .from("students")
            .select("id, displayname, email, profileimage, courseid")
            .eq("email", user.email)
            .single();
          if (userErr) throw userErr;

          const { data: courseData } = await supabase
            .from("courses")
            .select("name")
            .eq("id", dbUser.courseid)
            .single();

          const { data: moduleData } = await supabase
            .from("user_modules")
            .select("moduleid, modules(name)")
            .eq("userid", dbUser.id);

          setUserData({
            ...dbUser,
            courseName: courseData?.name || "No course selected",
          });

          setModules(moduleData?.map((m) => m.modules.name) || []);
        }
      } catch (err) {
        console.error("❌ Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Loading profile...
      </div>
    );

  return (
    <div>
      <div className="font-inter flex min-h-screen flex-col items-center bg-[#F2EFE8] px-6 pt-24 pb-10 text-black">
        <Navbar />
        {/* Profile Section */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            {userData?.profileimage ? (
              <img
                src={userData.profileimage}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-200 text-3xl font-bold text-gray-700">
                {userData?.displayname?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute right-0 bottom-0 rounded-full bg-gray-800 p-2 text-white transition-all hover:bg-gray-700"
            >
              <FaEdit size={12} />
            </button>
          </div>

          <h2 className="mt-4 text-xl font-semibold">
            {userData?.displayname}
          </h2>
          <p className="text-sm text-gray-400">{userData?.email}</p>
        </div>

        {/* Info Section (Boxed layout) */}
        <div className="mt-8 w-full max-w-md space-y-5">
          {/* Course Info */}
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5">
            <h3 className="mb-2 text-center text-sm tracking-wide text-gray-500 uppercase">
              Course
            </h3>
            <p className="text-center text-base font-medium text-gray-900">
              {userData?.courseName}
            </p>
          </div>

          {/* Modules Info */}
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5">
            <h3 className="mb-2 text-center text-sm tracking-wide text-gray-500 uppercase">
              Modules
            </h3>
            {modules.length > 0 ? (
              <ul className="space-y-1 text-center text-sm text-gray-700">
                {modules.map((mod, idx) => (
                  <li key={idx}>{mod}</li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-gray-400">
                No modules selected yet.
              </p>
            )}
          </div>
        </div>

        {/* Profile Image Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <Modal
              PFPS={PFPS}
              onClose={() => setIsModalOpen(false)}
              onConfirm={async (selectedUrl) => {
                if (!selectedUrl) return;
                setUpdating(true);
                try {
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  const { error } = await supabase
                    .from("students")
                    .update({ profileimage: selectedUrl })
                    .eq("email", user.email);

                  if (error) throw error;
                  // update local page state
                  setUserData((prev) => ({
                    ...prev,
                    profileimage: selectedUrl,
                  }));
                  // update global context so other components reflect the change immediately
                  if (setProfile) {
                    setProfile((prev) => ({
                      ...(prev || {}),
                      profileimage: selectedUrl,
                    }));
                  }
                  setIsModalOpen(false);
                } catch (err) {
                  console.error("❌ Error updating profile picture:", err);
                  alert("Failed to update profile picture.");
                } finally {
                  setUpdating(false);
                }
              }}
              updating={updating}
            />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AccountPage;
