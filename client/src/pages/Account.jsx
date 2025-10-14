import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Dialog } from "@headlessui/react";
import { FaEdit } from "react-icons/fa";
import { Loader2 } from "lucide-react";

const AccountPage = () => {
  const [userData, setUserData] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPfp, setSelectedPfp] = useState(null);
  const [updating, setUpdating] = useState(false);

 const PFPS = import.meta.env.VITE_PFPS
  ? JSON.parse(import.meta.env.VITE_PFPS)
  : [];


  useEffect(() => {
  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found.");

      // Fetch corresponding user record
      const { data: dbUser, error: userErr } = await supabase
        .from("user")
        .select("id, displayname, email, profileimage, courseid")
        .eq("email", user.email)
        .single();
      if (userErr) throw userErr;

      // Fetch course info
      const { data: courseData } = await supabase
        .from("courses")
        .select("name")
        .eq("id", dbUser.courseid)
        .single();

      // Fetch user modules
      const { data: moduleData } = await supabase
        .from("user_modules")
        .select("moduleid, modules(name)")
        .eq("userid", dbUser.id);

      setUserData({
        ...dbUser,
        courseName: courseData?.name || "No course selected",
      });

      setModules(moduleData?.map((m) => m.modules.name) || []);
    } catch (err) {
      console.error("❌ Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchUserData();
}, []);

  const handleProfileUpdate = async () => {
    if (!selectedPfp) return;
    setUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("user")
        .update({ profileImage: selectedPfp })
        .eq("email", user.email);

      if (error) throw error;

      setUserData((prev) => ({ ...prev, profileImage: selectedPfp }));
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Error updating profile picture:", err);
      alert("Failed to update profile picture.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-8">
      {/* Profile Section */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <img
            src={
              userData?.profileImage ||
              "https://i.imgur.com/placeholder.png"
            }
            alt="Profile"
            className="w-28 h-28 rounded-full border-2 border-gray-700 object-cover"
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-all"
          >
            <FaEdit size={14} />
          </button>
        </div>

        <h2 className="mt-4 text-lg font-semibold">{userData?.displayname}</h2>
        <p className="text-gray-400 text-sm">{userData?.email}</p>
      </div>

      {/* Course Info */}
      <div className="w-full mt-8 bg-neutral-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm text-gray-400 uppercase mb-1">Course</h3>
        <p className="text-base font-medium text-white">{userData?.courseName}</p>
      </div>

      {/* Modules Info */}
      <div className="w-full mt-4 bg-neutral-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm text-gray-400 uppercase mb-1">Modules</h3>
        {modules.length > 0 ? (
          <ul className="list-disc list-inside text-gray-200 text-sm space-y-1">
            {modules.map((mod, idx) => (
              <li key={idx}>{mod}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No modules selected yet.</p>
        )}
      </div>

      {/* Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-neutral-900 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <Dialog.Title className="text-lg font-semibold mb-4 text-white">
              Choose Your Profile Picture
            </Dialog.Title>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
              {PFPS.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`pfp-${i}`}
                  onClick={() => setSelectedPfp(url)}
                  className={`w-20 h-20 rounded-full object-cover border-2 cursor-pointer transition-transform ${
                    selectedPfp === url
                      ? "border-gray-200 scale-105"
                      : "border-transparent hover:scale-105"
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                disabled={!selectedPfp || updating}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  !selectedPfp || updating
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-gray-200 text-black hover:bg-white"
                }`}
              >
                {updating ? "Updating..." : "Select"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default AccountPage;
