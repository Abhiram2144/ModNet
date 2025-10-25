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
      <div className="flex items-center justify-center h-screen text-gray-400">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Loading profile...
      </div>
    );

  return (
    <div>
      <div className="min-h-screen   bg-white text-black font-inter flex flex-col items-center px-6 pt-24 pb-10">
        <Navbar />
        {/* Profile Section */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            {userData?.profileimage ? (
              <img
                src={userData.profileimage}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-amber-200 flex items-center justify-center text-3xl font-bold text-gray-700">
                {userData?.displayname?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-all"
            >
              <FaEdit size={12} />
            </button>
          </div>

          <h2 className="mt-4 text-xl font-semibold">
            {userData?.displayname}
          </h2>
          <p className="text-gray-400 text-sm">{userData?.email}</p>
        </div>

        {/* Info Section (Boxed layout) */}
        <div className="w-full max-w-md mt-8 space-y-5">
          {/* Course Info */}
          <div className="bg-white rounded-2xl px-6 py-5 border border-gray-200">
            <h3 className="text-center text-sm text-gray-500 uppercase mb-2 tracking-wide">
              Course
            </h3>
            <p className="text-center text-base font-medium text-gray-900">
              {userData?.courseName}
            </p>
          </div>

          {/* Modules Info */}
          <div className="bg-white rounded-2xl px-6 py-5 border border-gray-200">
            <h3 className="text-center text-sm text-gray-500 uppercase mb-2 tracking-wide">
              Modules
            </h3>
            {modules.length > 0 ? (
              <ul className="text-gray-700 text-sm space-y-1 text-center">
                {modules.map((mod, idx) => (
                  <li key={idx}>{mod}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm text-center">
                No modules selected yet.
              </p>
            )}
          </div>
        </div>

        {/* Profile Image Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
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
                    setProfile((prev) => ({ ...(prev || {}), profileimage: selectedUrl }));
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
