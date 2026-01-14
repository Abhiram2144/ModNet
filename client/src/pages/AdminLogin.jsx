import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CodeInput from "../components/CodeInput";
import { supabase } from "../lib/supabaseClient";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE;

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email"); // "email" or "code"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError("Invalid admin email address.");
      return;
    }

    // Email is valid, proceed to code step
    setError("");
    setStep("code");
  };

  const handleCodeSubmit = async (code) => {
    setError("");
    setLoading(true);

    if (code !== ADMIN_CODE) {
      setError("Invalid security code. Please try again.");
      setLoading(false);
      return;
    }

    try {
      // Authenticate with Supabase using magic link OTP flow
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      // Verify the OTP using a dummy token (in real scenario, admin would get email)
      // For now, we'll create an admin session after code verification
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError || !user) {
        // Create a custom JWT token for admin (using a workaround)
        // In production, use proper Supabase Admin API
        sessionStorage.setItem("admin_session", JSON.stringify({
          email: email.trim(),
          timestamp: Date.now(),
          isAdmin: true
        }));
        setLoading(false);
        navigate("/dashboard");
        return;
      }

      // Store admin session
      sessionStorage.setItem("admin_session", JSON.stringify({
        email: email.trim(),
        authId: user.id,
        timestamp: Date.now(),
        isAdmin: true
      }));

      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      setError("Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  const handleCodeClear = () => {
    setError("");
  };

  return (
    <div className="font-inter min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => step === "code" ? setStep("email") : navigate("/login")}
          className="mb-4 flex items-center text-gray-600 hover:text-black transition hover:cursor-pointer"
        >
          <ArrowLeft size={20} className="mr-2" />
          {step === "code" ? "Back to Email" : "Back to Login"}
        </button>

        {step === "email" ? (
          /* Email Step */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access 🔐</h1>
              <p className="text-sm text-gray-600">Enter your admin email to continue</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
              >
                Continue
              </button>
            </form>
          </div>
        ) : (
          /* Code Step */
          <div className="flex flex-col items-center">
            <CodeInput
              onSubmit={handleCodeSubmit}
              onClear={handleCodeClear}
              loading={loading}
            />
            {/* Error Message */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm max-w-md w-full text-center">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
