import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/ModNetLogo.png";
import { LogIn, LogOut } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogin = () => navigate("/login");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div
      className="flex flex-col justify-between min-h-screen bg-[#FAFAFA] text-black font-[Kaisei_Decol] px-6"
      style={{ fontFamily: "'Kaisei Decol', serif" }}
    >
      

      {/* Main Content */}
      <main className="flex flex-col justify-center items-center text-center flex-grow">
        <h1 className="text-5xl font-semibold mb-4 tracking-tight">ModNet</h1>
        <p className="text-lg text-gray-700 max-w-xs leading-relaxed">
          Join real-time discussion channels with classmates studying the same
          modules — exchange ideas, notes, and motivation.
        </p>
      </main>

      {/* Optional CTA */}
      <div className="flex justify-center mb-10">
        <button
          onClick={() => (user ? navigate("/home") : navigate("/login"))}
          className="px-6 py-3 rounded-xl bg-[#6B4F4F] text-white font-medium hover:bg-[#553b3b] transition-all"
        >
          {user ? "Go to Dashboard" : "Get Started"}
        </button>
      </div>
    </div>
  );
}
