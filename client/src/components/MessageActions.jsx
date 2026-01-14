import { useState } from "react";
import { Pencil, Trash2, Flag, X, Check } from "lucide-react";
import { editMessage, softDeleteMessage, reportMessage, canModifyMessage } from "../lib/gdprHelpers";

export default function MessageActions({
  message,
  isOwn,
  studentId,
  messageType = "module",
  onUpdate,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if message can be modified (within 30 minutes)
  const canModify = canModifyMessage(message.created_at);

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    if (!canModify) {
      alert("Messages can only be edited within 30 minutes of posting.");
      setIsEditing(false);
      return;
    }
    
    setLoading(true);

    const { data, error } = await editMessage(
      message.id,
      editContent,
      messageType
    );

    if (error) {
      if (error.message.includes("0 rows")) {
        alert("This message can no longer be edited (30 minute window expired).");
      } else {
        alert("Failed to edit message: " + error.message);
      }
    } else if (data) {
      setIsEditing(false);
      if (onUpdate) onUpdate(data);
    }

    setLoading(false);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!canModify) {
      alert("Messages can only be deleted within 30 minutes of posting.");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this message?")) return;

    setLoading(true);
    const { data, error } = await softDeleteMessage(message.id, messageType);

    if (error) {
      if (error.message.includes("0 rows")) {
        alert("This message can no longer be deleted (30 minute window expired).");
      } else {
        alert("Failed to delete message: " + error.message);
      }
    } else if (data) {
      if (onUpdate) onUpdate(data);
    }

    setLoading(false);
    setShowMenu(false);
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert("Please provide a reason for reporting.");
      return;
    }

    setLoading(true);
    const { error } = await reportMessage(
      message.id,
      messageType,
      reportReason,
      studentId
    );

    if (error) {
      alert("Failed to report message: " + error.message);
    } else {
      alert("Message reported successfully. Moderators will review it.");
      setShowReportModal(false);
      setReportReason("");
    }

    setLoading(false);
    setShowMenu(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-xs text-gray-500 hover:text-gray-700"
          aria-label="Message options"
        >
          ⋮
        </button>

        {showMenu && (
          <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
            {isOwn && canModify && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={loading}
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  disabled={loading}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </>
            )}
            {isOwn && !canModify && (
              <div className="px-3 py-2 text-xs text-gray-500">
                Edit/delete expired (30 min limit)
              </div>
            )}
            {!isOwn && (
              <button
                onClick={() => {
                  setShowReportModal(true);
                  setShowMenu(false);
                }}
                className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
                disabled={loading}
              >
                <Flag size={14} />
                <span>Report</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Edit Message</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={4}
              disabled={loading}
            />
            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center space-x-1 rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={loading || !editContent.trim()}
              >
                <Check size={14} />
                <span>{loading ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Report Message</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-sm text-gray-600">
              Please explain why this message should be reviewed by moderators.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason for reporting..."
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={4}
              disabled={loading}
            />
            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="flex items-center space-x-1 rounded-lg bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
                disabled={loading || !reportReason.trim()}
              >
                <Flag size={14} />
                <span>{loading ? "Reporting..." : "Report"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
