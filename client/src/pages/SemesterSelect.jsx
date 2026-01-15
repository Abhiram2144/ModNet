import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CustomSelect from "../components/CustomSelect";

const SemesterSelect = () => {
  const [semester, setSemester] = useState("summer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAuth();

  // Pre-select semester if already set
  useEffect(() => {
    if (profile?.semester) {
      setSemester(profile.semester);
    }
  }, [profile]);

  // Check if course is selected
  useEffect(() => {
    if (!profile?.courseid) {
      navigate("/course-select");
    }
  }, [profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        throw new Error("Authentication error. Please log in again.");
      }

      // Get student record
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("userid", authUser.id)
        .single();

      if (studentError) throw studentError;

      // Update semester
      const { error: updateError } = await supabase
        .from("students")
        .update({ semester })
        .eq("id", student.id);

      if (updateError) throw updateError;

      // Update context
      if (setProfile) {
        setProfile((p) => ({ ...(p || {}), semester }));
      }

      // Navigate to module selection
      navigate("/modules");
    } catch (err) {
      console.error("Error saving semester:", err);
      setError(`Something went wrong: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/course-select");
  };

  return (
    <div className="font-inter flex min-h-screen items-center justify-center bg-[#F2EFE8] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-gray-900">
            Select Your Semester
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Step 2 of 3: Choose your current semester
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Semester
            </label>
            <CustomSelect
              value={semester}
              onChange={setSemester}
              options={[
                { value: "summer", label: "Summer Semester" },
                { value: "winter", label: "Winter Semester" }
              ]}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg py-3 text-sm font-semibold transition-all ${
                loading
                  ? "cursor-not-allowed bg-gray-300 text-gray-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "Saving..." : "Next: Select Modules"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SemesterSelect;
