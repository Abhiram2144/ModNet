import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Home, User, MessageSquare, Compass } from "lucide-react";

export default function Footer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const buttons = [
    { label: "Discover", icon: Compass, path: "/discover" },
    { label: "Home", icon: Home, path: "/home" },
    { label: "Account", icon: User, path: "/account" },
    { label: "Review", icon: MessageSquare, path: "/review" },
  ];

  return (
    <footer className="font-inter fixed right-0 bottom-0 left-0 flex justify-around border-t border-gray-200 bg-[#FAFAFA] py-3">
      {buttons.map(({ label, icon: Icon, path }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center transition-all hover:cursor-pointer ${
              isActive
                ? "-translate-y-1 scale-110 transform text-[#7D3C3C] drop-shadow-md"
                : "text-gray-600 hover:text-[#7D3C3C]"
            }`}
          >
            <Icon size={isActive ? 24 : 20} />
            <span className={`mt-1 text-xs ${isActive ? "font-semibold" : ""}`}>
              {label}
            </span>
          </button>
        );
      })}
    </footer>
  );
}
