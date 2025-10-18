import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/LoginForm";

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

    setLoading(false);
  };

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
