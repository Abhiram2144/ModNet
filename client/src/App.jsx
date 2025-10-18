import { BrowserRouter as Router, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import "../src/styles/index.css";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loader from "./components/Loader"; // ✅ replacing SplashScreen

function App() {
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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const isLoginPage = location.pathname === "/login";

useEffect(() => {
  if (!isLoginPage) { // ✅ Skip loader on login
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  } else {
    setIsLoading(false);
  }
}, [location.pathname]);

  // ✅ Control Navbar & Footer visibility
  const showNavbar = location.pathname !== "/login";
  const showFooter = location.pathname === "/home";

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 relative flex flex-col">
      {showNavbar && <Navbar />}
      <main className="flex-grow pb-16">
        <AppRoutes />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

export default App;
