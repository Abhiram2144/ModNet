import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import logo from "../assets/logo80.png";
import LoginButton from "../components/LoginButton";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      alert("logout");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Successfully logged out!");
      setTimeout(() => {
        navigate("/login");
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Error logging out!");
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-[#FAFAFA] border-b px-2 border-gray-300 shadow-sm min-h-[50px]  flex justify-between items-center z-50">
      {/* Logo Section */}
      <Link
        to="/home"
        className="flex items-center gap-2 hover:opacity-90 transition"
      >
        <img src={logo} alt="ModNet Logo" className="w-8 h-8 object-contain" />
        {/* <span className="text-xl font-bold text-gray-800">ModNet</span> */}
      </Link>

      {/* Navigation Links + Auth Buttons */}
      <div className="flex items-center space-x-4 ">
        {user ? (
          <button
            className="bg-amber-200 p-2 rounded-md flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={18} className="text-gray-700" />
          </button>
        ) : (
          <button
            className="bg-amber-200 p-2 rounded-md"
            onClick={() => {
              navigate("/login");
            }}
          />
        )}
      </div>
    </nav>
  );
}
