import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { acceptConsent } from "../lib/gdprHelpers";
import { CheckCircle } from "lucide-react";
import Loader from "../components/Loader";

export default function ConsentPage() {
  const { user, setProfile } = useAuth();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    if (!agreed) {
      setError("Please check the box to accept the terms and conditions.");
      return;
    }

    setAccepting(true);
    setError("");

    const { data, error: err } = await acceptConsent(user.id);

    if (err) {
      setError("Failed to accept consent. Please try again.");
      setAccepting(false);
      return;
    }

    // Update profile in context
    if (data && setProfile) {
      setProfile(data);
    }

    // Show loader animation before navigating
    await new Promise(resolve => setTimeout(resolve, 1500));
    navigate("/home");
  };

  // Show loader while processing
  if (accepting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2EFE8]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="font-inter min-h-screen bg-[#F2EFE8] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mb-2">
            Privacy & Terms
          </h1>
          <p className="text-sm text-gray-600">
            Please review and accept our terms to continue using ModNet
          </p>
        </div>

        {/* Content */}
        <div className="mb-6 max-h-[60vh] overflow-y-auto space-y-4 text-sm text-gray-700 px-2">
          <p className="text-base">
            Welcome to <strong>ModNet</strong>. Before you continue, please
            review and accept our data processing practices.
          </p>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center">
              <CheckCircle size={20} className="mr-2 text-blue-600" />
              What data we collect
            </h3>
            <ul className="ml-5 list-disc space-y-2 text-gray-700">
              <li>Your university email address (for authentication)</li>
              <li>Display name (derived from your email)</li>
              <li>Profile image (optional)</li>
              <li>Messages and files you send in module and group chats</li>
              <li>Your module enrollments and group memberships</li>
            </ul>
          </div>

          <div className="rounded-lg bg-green-50 border border-green-200 p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center">
              <CheckCircle size={20} className="mr-2 text-green-600" />
              How we use your data
            </h3>
            <ul className="ml-5 list-disc space-y-2 text-gray-700">
              <li>To provide educational communication services</li>
              <li>To enable collaboration with classmates</li>
              <li>To maintain message history for academic purposes</li>
            </ul>
          </div>

          <div className="rounded-lg bg-purple-50 border border-purple-200 p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center">
              <CheckCircle size={20} className="mr-2 text-purple-600" />
              Your rights
            </h3>
            <ul className="ml-5 list-disc space-y-2 text-gray-700">
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

          <div className="rounded-lg bg-gray-50 border border-gray-300 p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center">
              <CheckCircle size={20} className="mr-2 text-gray-600" />
              Data security
            </h3>
            <ul className="ml-5 list-disc space-y-2 text-gray-700">
              <li>All data is encrypted in transit and at rest</li>
              <li>Row-level security ensures you can only access your data</li>
              <li>Files are stored in private buckets with signed URLs</li>
              <li>We comply with GDPR and UK data protection laws</li>
            </ul>
          </div>

          <p className="text-xs text-gray-600 italic bg-gray-50 p-3 rounded-lg">
            By accepting, you consent to the processing of your personal data as
            described above. You can withdraw consent at any time by deleting
            your account from the Account settings page.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Checkbox */}
        <div className="mb-6 flex items-start bg-gray-50 rounded-lg p-4">
          <input
            type="checkbox"
            id="consent-check"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="consent-check"
            className="ml-3 text-sm text-gray-700 cursor-pointer select-none"
          >
            I have read and agree to the{" "}
            <strong>Privacy Policy and Terms of Service</strong>, and I consent
            to the collection and processing of my personal data as described above.
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            disabled={accepting}
            className="w-full rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            disabled={accepting || !agreed}
            onClick={handleAccept}
            className={`w-full rounded-lg py-3 text-sm font-semibold transition-all ${
              accepting || !agreed
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {accepting ? "Processing..." : "Accept & Continue to ModNet"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          You must accept to use ModNet
        </p>
      </div>
    </div>
  );
}
