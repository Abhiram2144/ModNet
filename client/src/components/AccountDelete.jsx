import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { exportUserData, downloadExportedData } from "../lib/gdprHelpers";
import { Trash2, Download, AlertTriangle } from "lucide-react";
import Navbar from "../components/Navbar";

export default function AccountDelete() {
  const { user, profile, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [exporting, setExporting] = useState(false);

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

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      // Call the Edge Function for secure account deletion
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
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Account Settings
        </h1>

        {/* Profile Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Display Name
              </label>
              <p className="text-lg text-gray-900">
                {profile?.displayname || "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-lg text-gray-900">{profile?.email || user?.email}</p>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Data Management
          </h2>

          <div className="space-y-4">
            {/* Export Data */}
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
              disabled={loading}
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmText !== "DELETE"}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
