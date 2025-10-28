import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 text-center text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <AlertTriangle className="h-16 w-16 text-amber-500" />
        <h1 className="text-5xl font-bold">404</h1>
        <h2 className="mb-2 text-xl font-semibold">Page Not Found</h2>
        <p className="mb-6 max-w-md text-gray-500">
          Looks like you’ve wandered off the course. The page you’re looking for
          doesn’t exist or has been moved.
        </p>

        <button
          onClick={() => navigate("/")}
          className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow transition hover:bg-blue-700"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}
