import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import { Loader2, Trash2, Download, AlertTriangle } from "lucide-react";
import Modal from "../components/Modal";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import { exportUserData, downloadExportedData } from "../lib/gdprHelpers";

const AccountPage = () => {
  const [userData, setUserData] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("summer");
  const { profile, userModules, setProfile, user, setUser } = useAuth();
  const navigate = useNavigate();
  // if profile is already preloaded, don't show the loader
  const [loading, setLoading] = useState(!profile);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);

  const PFPS = import.meta.env.VITE_PFPS
    ? JSON.parse(import.meta.env.VITE_PFPS)
    : [];

  const handleExportData = async () => {
    setExporting(true);
    const { data, error } = await exportUserData(user.id);

    if (error) {
      alert("Failed to export data: " + error.message);
      setExporting(false);
      return;
    }

    downloadExportedData(data);
    alert("Your data has been downloaded!");
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      alert("Please type DELETE to confirm account deletion.");
      return;
    }

    setDeleting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(
          "Account deleted successfully. Your messages have been anonymized."
        );
        await supabase.auth.signOut();
        setUser(null);
        navigate("/");
      } else {
        alert("Failed to delete account: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      alert("Error deleting account: " + error.message);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleChangeSemester = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .update({ semester: selectedSemester })
        .eq("id", userData.id);

      if (error) throw error;

      // Update profile context
      setProfile({ ...profile, semester: selectedSemester });
      alert(
        `Semester changed to ${selectedSemester}. You'll need to select modules for the new semester.`
      );
      setShowSemesterModal(false);
      // Redirect to module selection
      navigate("/module-select");
    } catch (error) {
      alert("Failed to change semester: " + error.message);
    }
  };

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
      <div className="font-inter flex min-h-screen flex-col items-center bg-[#F2EFE8] px-6 pt-24 pb-24 text-black">
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
              Semester
            </h3>
            <p className="text-center text-base font-medium text-gray-900 capitalize">
              {userData?.semester || "summer"}
            </p>
            <button
              onClick={() => {
                setSelectedSemester(userData?.semester || "summer");
                setShowSemesterModal(true);
              }}
              className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition hover:bg-blue-700"
            >
              Change Semester
            </button>
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

        {/* Data Management & Danger Zone */}
        <div className="mt-8 mb-8 w-full max-w-md space-y-6">
          {/* Export Data */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Data Management
            </h2>
            <div className="flex items-start justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Export Your Data</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Download all your data including profile, messages, and
                  activity in JSON format.
                </p>
              </div>
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="ml-4 flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                <Download size={18} />
                <span>{exporting ? "Exporting..." : "Export"}</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 shadow">
            <div className="mb-4 flex items-center space-x-2 text-red-800">
              <AlertTriangle size={24} />
              <h2 className="text-xl font-semibold">Danger Zone</h2>
            </div>

            <div className="rounded-lg border border-red-300 bg-white p-4">
              <h3 className="font-semibold text-gray-900">Delete Account</h3>
              <p className="mt-2 text-sm text-gray-600">
                Once you delete your account, there is no going back. Your profile
                and memberships will be removed, and your messages will be
                anonymized to preserve conversation context.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="mt-4 flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
              >
                <Trash2 size={18} />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center space-x-2 text-red-600">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-bold">Delete Account</h3>
              </div>

              <div className="mb-6 space-y-3 text-sm text-gray-700">
                <p className="font-semibold">
                  This action is permanent and cannot be undone!
                </p>
                <p>When you delete your account:</p>
                <ul className="ml-5 list-disc space-y-1">
                  <li>Your profile will be permanently removed</li>
                  <li>Your module enrollments will be deleted</li>
                  <li>Your messages will be anonymized as "[deleted user]"</li>
                  <li>Your uploaded files will be deleted</li>
                  <li>You will be immediately logged out</li>
                </ul>
                <p className="mt-4 font-semibold">
                  Type <span className="font-mono text-red-600">DELETE</span> to
                  confirm:
                </p>
              </div>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={deleting}
              />

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={deleting}
                  className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== "DELETE"}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Semester Change Modal */}
        {showSemesterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-semibold">Change Semester</h2>
              <p className="mb-4 text-sm text-gray-600">
                Changing your semester will require you to select modules for the new semester.
              </p>

              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="summer">Summer Semester</option>
                <option value="winter">Winter Semester</option>
              </select>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSemesterModal(false)}
                  className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeSemester}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Change Semester
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AccountPage;
