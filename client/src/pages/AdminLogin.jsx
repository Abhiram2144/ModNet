import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CodeInput from "../components/CodeInput";

const ADMIN_EMAIL = "abhiram.sathiraju@gmail.com";
const ADMIN_CODE = "200104";

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

  const handleCodeSubmit = (code) => {
    setError("");
    setLoading(true);

    if (code !== ADMIN_CODE) {
      setError("Invalid security code. Please try again.");
      setLoading(false);
      return;
    }

    // Store admin session in sessionStorage
    sessionStorage.setItem("admin_session", JSON.stringify({ email, timestamp: Date.now() }));
    
    setLoading(false);
    navigate("/dashboard");
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
