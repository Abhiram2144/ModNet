import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/LoginForm";
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

    if (!email.endsWith("@student.le.ac.uk")) {
      setMessage("❌ Please use your university email address.");
      setLoading(false);
      return;
    }

    try {
      // Use signInWithOtp directly — let Supabase create the user if needed.
      // Creating a user manually via signUp before sending OTP can cause unexpected
      // auth state changes or redirects in some setups. signInWithOtp will create
      // the user when `shouldCreateUser` is true (default) and send the OTP.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
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

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      setMessage("❌ Invalid or expired OTP.");
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

    // Simulate 2-second loading animation
    setTimeout(async () => {
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
            { email, displayname: displayName, userid: authUser.id, created_at: new Date() },
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

      setShowLoader(false);
      setLoading(false);
    }, 2000);
  };

  if (showLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
        <Loader />
      </div>
    );
  }

  return (
    <LoginForm
      title="Welcome to ModNet 📘"
      email={email}
      otp={otp}
      step={step}
      loading={loading}
      message={message}
      onEmailChange={(e) => setEmail(e.target.value)}
      onOtpChange={(e) => setOtp(e.target.value)}
      onSubmit={step === "email" ? handleSendOtp : handleVerifyOtp}
      onSwitch={() => setStep("email")}
    />
  );
};

export default Login;
