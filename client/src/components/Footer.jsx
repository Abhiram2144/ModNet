import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Home, User, MessageSquare } from "lucide-react";

export default function Footer() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const buttons = [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Account", icon: User, path: "/account" },
    { label: "Review", icon: MessageSquare, path: "/review" },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] border-t border-gray-200 flex justify-around py-3 font-inter">
      {buttons.map(({ label, icon: Icon, path }) => (
        <button
          key={label}
          onClick={() => navigate(path)}
          className="flex flex-col items-center text-gray-600 hover:text-[#7D3C3C] transition"
        >
          <Icon size={20} />
          <span className="text-xs mt-1">{label}</span>
        </button>
      ))}
    </footer>
  );
}
