import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Home, User, MessageSquare } from "lucide-react";

export default function Footer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const buttons = [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Account", icon: User, path: "/account" },
    { label: "Review", icon: MessageSquare, path: "/review" },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] border-t border-gray-200 flex justify-around py-3 font-inter">
      {buttons.map(({ label, icon: Icon, path }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center transition-all hover:cursor-pointer ${
              isActive
                ? "text-[#7D3C3C] transform scale-110 -translate-y-1 drop-shadow-md"
                : "text-gray-600 hover:text-[#7D3C3C]"
            }`}
          >
            <Icon size={isActive ? 24 : 20} />
            <span className={`text-xs mt-1 ${isActive ? "font-semibold" : ""}`}>{label}</span>
          </button>
        );
      })}
    </footer>
  );
}
