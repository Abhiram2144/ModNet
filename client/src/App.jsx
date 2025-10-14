import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import "../src/styles/App.css";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { AuthProvider } from "./contexts/AuthContext";
import SplashScreen from "./pages/SplashScreen";
// import {MobileNavbar} from "../src/components/MobileNavbar"

function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Keep splash visible for a minimum of ~3.5 seconds
    const timer = setTimeout(() => setSplashDone(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-900 relative">
          <AppRoutes />
          {/* <MobileNavbar /> */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
