import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/ModNetLogo.png";
import { LogIn, LogOut } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // simple reset of context/UI after logout
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white text-black relative px-6">
      {/* Header */}
      <div className="absolute top-6 left-6 flex items-center space-x-2">
        <img src={logo} alt="ModNet Logo" className="w-10" />
      </div>

      <button
        onClick={user ? handleLogout : handleLogin}
        className="absolute top-6 right-6 p-2 text-gray-800 hover:text-black transition"
        title={user ? "Log out" : "Log in"}
      >
        {user ? <LogOut size={22} /> : <LogIn size={22} />}
      </button>

      {/* Content */}
      <div className="text-center mt-16">
        <h1 className="text-4xl font-serif font-bold mb-4">ModNet</h1>
        <p className="text-gray-600 text-base max-w-sm mx-auto">
          Join real-time discussion channels with classmates studying the same
          modules — exchange ideas, notes, and motivation.
        </p>
      </div>
    </div>
  );
}
