import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/LoginForm";
import CodeInput from "../components/CodeInput";
import Loader from "../components/Loader";

const Login = () => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Accept a username and append the university domain.
    const username = email.trim();
    if (!username) {
      setMessage("❌ Please enter your university username.");
      setLoading(false);
      return;
    }
    const fullEmail = `${username}@student.le.ac.uk`;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: fullEmail,
        options: { shouldCreateUser: true },
      });

      if (error) {
        setMessage(`❌ Error sending OTP: ${error.message}`);
      } else {
        setMessage("✅ OTP sent to your university email.");
        setStep("verify");
        // store the full email for verification step
        setEmail(fullEmail);
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

    // show loader immediately so users don't see the email input flash
    setShowLoader(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      setMessage("❌ Invalid or expired OTP.");
      setShowLoader(false);
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;
    setUser(authUser);

    if (!authUser) {
      setMessage("⚠️ No authenticated user found.");
      setLoading(false);
      return;
    }

    // ✅ Start Loader before data fetch and preloading
    setShowLoader(true);

    // Preload heavy routes while loader is active
    const preloadPages = async () => {
      try {
        const home = import("../pages/Home");
        const account = import("../pages/Account");
        const review = import("../pages/Review");
        await Promise.all([home, account, review]);
      } catch (err) {
        console.warn("⚠️ Page preloading failed:", err);
      }
    };

    await preloadPages();

    try {
      const { data: existingStudent } = await supabase
        .from("students")
        .select("*")
        .eq("email", email)
        .single();

      let studentId = existingStudent?.id;

      if (!existingStudent) {
        const displayName = email.split("@")[0];
        const { data: insertedStudent } = await supabase
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

        studentId = insertedStudent.id;
      }

      const { data: studentModules } = await supabase
        .from("user_modules")
        .select("id")
        .eq("userid", studentId);

      if (!studentModules || studentModules.length === 0) navigate("/modules");
      else navigate("/home");
    } catch (err) {
      console.warn("Login post-checks failed:", err);
    } finally {
      setShowLoader(false);
      setLoading(false);
    }
  };

  // Verify using the 6-digit code input component (receives code string)
  const handleVerifyCode = async (code) => {
    setLoading(true);
    setMessage("");

    // show loader immediately so users don't see the email input flash
    setShowLoader(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      setMessage("❌ Invalid or expired OTP.");
      setShowLoader(false);
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;
    setUser(authUser);

    if (!authUser) {
      setMessage("⚠️ No authenticated user found.");
      setLoading(false);
      return;
    }

    // ✅ Start Loader before data fetch and preloading
    setShowLoader(true);

    // Preload heavy routes while loader is active
    const preloadPages = async () => {
      try {
        const home = import("../pages/Home");
        const account = import("../pages/Account");
        const review = import("../pages/Review");
        await Promise.all([home, account, review]);
      } catch (err) {
        console.warn("⚠️ Page preloading failed:", err);
      }
    };

    await preloadPages();

    try {
      const { data: existingStudent } = await supabase
        .from("students")
        .select("*")
        .eq("email", email)
        .single();

      let studentId = existingStudent?.id;

      if (!existingStudent) {
        const displayName = email.split("@")[0];
        const { data: insertedStudent } = await supabase
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

        studentId = insertedStudent.id;
      }

      const { data: studentModules } = await supabase
        .from("user_modules")
        .select("id")
        .eq("userid", studentId);

      if (!studentModules || studentModules.length === 0) navigate("/modules");
      else navigate("/home");
    } catch (err) {
      console.warn("Login post-checks failed:", err);
    } finally {
      setShowLoader(false);
      setLoading(false);
    }
  };

  const handleResendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!email) {
      setMessage("❌ No email to resend to. Please enter your university username first.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      if (error) {
        setMessage(`❌ Error resending OTP: ${error.message}`);
      } else {
        setMessage("✅ OTP resent to your university email.");
      }
    } catch (err) {
      setMessage(`⚠️ Unexpected error: ${err?.message || err}`);
    }

    setLoading(false);
  };

  if (showLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative">
      {step === "email" ? (
        <LoginForm
          title="Welcome to ModNet 📘"
          email={email}
          otp={otp}
          step={step}
          loading={loading}
          message={message}
          onEmailChange={(e) => setEmail(e.target.value)}
          onOtpChange={(e) => setOtp(e.target.value)}
          onSubmit={handleSendOtp}
          onSwitch={() => setStep("email")}
          onResend={handleResendOtp}
        />
      ) : (
        <div className="font-inter min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <button
              onClick={() => setStep("email")}
              className="mb-4 flex items-center text-gray-600 hover:text-black transition hover:cursor-pointer"
            >
              ← Back to Email
            </button>

            <CodeInput
              onSubmit={handleVerifyCode}
              onClear={() => setMessage("")}
              loading={loading}
            />

            {message && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm max-w-md w-full text-center">
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <button
          onClick={() => navigate("/admin/login")}
          className="text-sm text-gray-600 hover:text-gray-900 underline hover:cursor-pointer"
        >
          Sign in as Admin
        </button>
      </div>
    </div>
  );
};

export default Login;
