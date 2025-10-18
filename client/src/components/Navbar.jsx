import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, LogOut } from "lucide-react";
import logo from "../assets/logo80.png";

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogin = () => navigate("/login");
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-[#FAFAFA] border-b border-gray-200">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
        <img src={logo} alt="ModNet Logo" className="w-10 h-auto" />
        {/* <h1 className="text-xl font-semibold text-black font-[Kaisei_Decol]">ModNet</h1> */}
      </div>

      <button
        onClick={user ? handleLogout : handleLogin}
        className="p-2 rounded-full hover:bg-[#7D3C3C]/10 transition"
        title={user ? "Log out" : "Log in"}
      >
        {user ? (
          <LogOut size={22} className="text-[#7D3C3C]" />
        ) : (
          <LogIn size={22} className="text-[#7D3C3C]" />
        )}
      </button>
    </nav>
  );
}
