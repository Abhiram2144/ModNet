import { useEffect, useState } from "react";
import logo from "../assets/ModNetLogo.png";
import { supabase } from "../lib/supabaseClient";

// Preload helper: loads route chunks in the background
const preloadRoutes = async () => {
  try {
    await Promise.all([
      import("../pages/LandingPage"),
      import("../pages/Login"),
    //   import("../pages/DashboardPage"), // example
    //   import("../pages/ReviewPage"),     // example
    ]);
  } catch (err) {
    console.warn("⚠️ Route preloading error:", err);
  }
};

// Preload helper: loads important assets (logos, etc.)
const preloadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = resolve;
    img.onerror = reject;
  });

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadResources = async () => {
      const steps = [
        { fn: () => preloadImage(logo), weight: 20 },
        { fn: () => preloadRoutes(), weight: 50 },
        { fn: () => supabase.auth.getSession(), weight: 30 },
      ];

      for (const step of steps) {
        await step.fn();
        setProgress((prev) => Math.min(prev + step.weight, 100));
      }

      // Wait a bit to make it feel smooth
      setTimeout(onFinish, 500);
    };

    loadResources();
  }, [onFinish]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white">
      <img src={logo} alt="ModNet Logo" className="w-40 mb-6" />
      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-black transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {progress < 100 ? `Loading ${progress}%` : "Ready"}
      </p>
    </div>
  );
}
