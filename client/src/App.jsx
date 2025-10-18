import { BrowserRouter as Router, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import "../src/styles/App.css";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { AuthProvider } from "./contexts/AuthContext";
import SplashScreen from "./pages/SplashScreen";
import Navbar from "./components/Navbar";  // ✅ Add this import
import Footer from "./components/Footer";  // ✅ Add this import

function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <AuthProvider>
      <Router>
        <MainLayout />
      </Router>
    </AuthProvider>
  );
}

function MainLayout() {
  const location = useLocation();

  // ✅ Only show Footer on /home
  const showFooter = location.pathname === "/home";
  const showLogin = location.pathname !== "/login";
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 relative">
      {showLogin && <Navbar /> }
      <div className="pb-16"> {/* Padding so footer doesn't overlap content */}
        <AppRoutes />
      </div>
      {showFooter && <Footer />} {/* Only show on Home */}
    </div>
  );
}

export default App;
