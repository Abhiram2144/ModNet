import { useLocation, useNavigate } from "react-router-dom";
import { Home, User, Star } from "lucide-react";

export default function MobileNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide navbar on auth routes
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const navItems = [
    { path: "/home", label: "Home", icon: Home },
    { path: "/account", label: "Account", icon: User },
    { path: "/review", label: "Review", icon: Star },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 flex justify-around items-center py-2 md:hidden z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.3)] rounded-t-2xl">
      {navItems.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center text-xs transition ${
              isActive ? "text-blue-500" : "text-gray-400 hover:text-white"
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] mt-1">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
