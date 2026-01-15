import { useState } from "react";
import { acceptConsent } from "../lib/gdprHelpers";
import { useAuth } from "../contexts/AuthContext";

export default function ConsentModal({ onAccept }) {
  const { user, setProfile } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    setAccepting(true);
    setError("");

    const { data, error: err } = await acceptConsent(user.id);

    if (err) {
      setError("Failed to accept consent. Please try again.");
      setAccepting(false);
      return;
    }

    // Update profile in context
    if (data) {
      setProfile(data);
    }

    setAccepting(false);
    if (onAccept) onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Privacy & Data Consent
        </h2>

        <div className="mb-6 max-h-96 space-y-4 overflow-y-auto text-sm text-gray-700">
          <p>
            Welcome to <strong>ModNet</strong>. Before you continue, please
            review and accept our data processing practices.
          </p>

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">
              What data we collect:
            </h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>Your university email address (for authentication)</li>
              <li>Display name (derived from your email)</li>
              <li>Profile image (optional)</li>
              <li>
                Messages and files you send in module and group chats
              </li>
              <li>Your module enrollments and group memberships</li>
            </ul>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">
              How we use your data:
            </h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>To provide educational communication services</li>
              <li>To enable collaboration with classmates</li>
              <li>To maintain message history for academic purposes</li>
            </ul>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Your rights:</h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Access:</strong> Export your data at any time
              </li>
              <li>
                <strong>Rectification:</strong> Edit or delete your messages
              </li>
              <li>
                <strong>Erasure:</strong> Request account deletion (your
                messages will be anonymized)
              </li>
              <li>
                <strong>Portability:</strong> Download your data in JSON format
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-amber-50 p-4">
            <h3 className="mb-2 font-semibold text-amber-900">
              Data retention after deletion:
            </h3>
            <p className="text-amber-800">
              When you delete a message or request data deletion, the information is removed from your view immediately. However, to comply with GDPR regulations and maintain system integrity, deleted data will be retained in our database for <strong>30 days</strong> to ensure proper data processing and audit compliance. After 30 days, all deleted personal data will be permanently and irreversibly removed from our systems.
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">
              Data security:
            </h3>
            <ul className="ml-5 list-disc space-y-1 text-blue-800">
              <li>All data is encrypted in transit and at rest</li>
              <li>
                Row-level security ensures you can only access your data
              </li>
              <li>Files are stored in private buckets with signed URLs</li>
              <li>We comply with GDPR and UK data protection laws</li>
            </ul>
          </div>

          <p className="text-xs text-gray-600">
            By accepting, you consent to the processing of your personal data as
            described above. You can withdraw consent at any time by deleting
            your account. For more information, see our{" "}
            <a href="/privacy" className="text-blue-600 underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            disabled={accepting}
            onClick={handleAccept}
            className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {accepting ? "Accepting..." : "Accept & Continue"}
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          You must accept to use ModNet. If you decline, please close this page.
        </p>
      </div>
    </div>
  );
}
