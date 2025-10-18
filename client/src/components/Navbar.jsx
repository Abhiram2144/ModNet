import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, LogOut } from "lucide-react";
import logo from "../assets/logo80.png";
import StyleButton from "./StyleButton"; 
import LoginButton from "../components/LoginButton"

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogin = () => navigate("/login");
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="w-full bg-[#FAFAFA] fixed top-0 left-0 z-50 shadow-sm">
  <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
    {/* Logo */}
    <div
      className="flex items-center gap-2 cursor-pointer"
      onClick={() => navigate("/")}
    >
      <img src={logo} alt="ModNet Logo" className="w-8 h-auto" />
    </div>

    {/* Auth Button */}
    <div className="flex items-center gap-3 pr-4"> {/* Added pr-4 */}
      <div
        onClick={user ? handleLogout : handleLogin}
        title={user ? "Log out" : "Log in"}
      >
        <LoginButton text1="Login" text2="Now" />
      </div>
    </div>
  </div>
</nav>

  );
}
