import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!email.endsWith("@student.le.ac.uk")) {
      setMessage("❌ Please use your university email address.");
      setLoading(false);
      return;
    }

    try {
      const dummyPassword = Math.random().toString(36).slice(-10);
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: dummyPassword,
      });

      if (signUpError && !signUpError.message.includes("already registered")) {
        setMessage(`❌ Error creating account: ${signUpError.message}`);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (error) {
        setMessage(`❌ Error sending OTP: ${error.message}`);
      } else {
        setMessage("✅ OTP sent to your university email.");
        setStep("verify");
      }
    } catch (err) {
      setMessage(`⚠️ Unexpected error: ${err.message}`);
    }

    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      setMessage(`❌ Invalid or expired OTP.`);
      setLoading(false);
      return;
    }

    // Get session and user from auth.users
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;
    setUser(authUser);

    if (!authUser) {
      setMessage("⚠️ No authenticated user found.");
      setLoading(false);
      return;
    }

    // inside handleVerifyOtp
    const { data: existingStudent, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("email", email)
      .single();

    let studentId = existingStudent?.id;

    if (!existingStudent) {
      const displayName = email.split("@")[0];
      const { data: insertedStudent, error: insertError } = await supabase
        .from("students")
        .insert([
          {
            email,
            displayname: displayName,
            userid: authUser.id,
            created_at: new Date(),
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      studentId = insertedStudent.id;
    }

    // ✅ Check if student has selected modules
    const { data: studentModules } = await supabase
      .from("user_modules")
      .select("id")
      .eq("userid", studentId);

    if (!studentModules || studentModules.length === 0) navigate("/modules");
    else navigate("/home");


    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
      <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Welcome to ModNet 📘
        </h1>

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Enter your university email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-sm text-blue-500 mt-1"
            >
              🔁 Resend OTP
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};

export default Login;
