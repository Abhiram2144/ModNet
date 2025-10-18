import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Home, User, MessageSquare } from "lucide-react";

export default function Footer() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] border-t border-gray-200 flex justify-around py-3">
      <button
        onClick={() => navigate("/home")}
        className="flex flex-col items-center text-gray-600 hover:text-[#7D3C3C] transition"
      >
        <Home size={20} />
        <span className="text-xs mt-1 font-[Kaisei_Decol]">Home</span>
      </button>

      <button
        onClick={() => navigate("/account")}
        className="flex flex-col items-center text-gray-600 hover:text-[#7D3C3C] transition"
      >
        <User size={20} />
        <span className="text-xs mt-1 font-[Kaisei_Decol]">Account</span>
      </button>

      <button
        onClick={() => navigate("/review")}
        className="flex flex-col items-center text-gray-600 hover:text-[#7D3C3C] transition"
      >
        <MessageSquare size={20} />
        <span className="text-xs mt-1 font-[Kaisei_Decol]">Review</span>
      </button>
    </footer>
  );
}
