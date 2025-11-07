import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import logo from "../assets/logo80.png";
import { LogOut, LogIn } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      // alert("logout");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Successfully logged out!");
      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Error logging out!");
    }
  };

  return (
    <nav className="fixed top-0 left-0 z-50 flex min-h-[50px] w-full items-center justify-between bg-[#FAFAFA] px-2 shadow-sm">
      {/* Logo Section */}
      <Link
        to="/home"
        className="flex items-center gap-2 transition hover:opacity-90"
      >
        <img
          src={logo}
          alt="ModNet Logo"
          className="h-12 w-12 object-contain"
        />
        {/* <span className="text-xl font-bold text-gray-800">ModNet</span> */}
      </Link>

      {/* Navigation Links + Auth Buttons */}
      <div className="flex items-center space-x-4">
        {user ? (
          <button
            className="flex items-center gap-2 rounded-md p-2 hover:cursor-pointer"
            onClick={handleLogout}
          >
            Logout <LogOut size={18} className="text-gray-700" />
          </button>
        ) : (
          <button
            className="flex items-center gap-2 rounded-md p-2 hover:cursor-pointer"
            onClick={() => {
              navigate("/login");
            }}
          >
            Log In <LogIn size={18} className="text-gray-700" />
          </button>
        )}
      </div>
    </nav>
  );
}
