import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CustomSelect from "../components/CustomSelect";

const CourseSelect = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("name");
      
      if (error) {
        console.error("Error fetching courses:", error);
        setError("Failed to load courses");
      } else {
        setCourses(data);
      }
    };
    fetchCourses();
  }, []);

  // Pre-select course if already set
  useEffect(() => {
    if (profile?.courseid) {
      setSelectedCourse(profile.courseid);
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse) {
      setError("Please select a course.");
      return;
    }

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

      // Update course
      const { error: updateError } = await supabase
        .from("students")
        .update({ courseid: selectedCourse })
        .eq("id", student.id);

      if (updateError) throw updateError;

      // Update context
      if (setProfile) {
        setProfile((p) => ({ ...(p || {}), courseid: selectedCourse }));
      }

      // Navigate to semester selection
      navigate("/semester-select");
    } catch (err) {
      console.error("Error saving course:", err);
      setError(`Something went wrong: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter flex min-h-screen items-center justify-center bg-[#F2EFE8] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-gray-900">
            Select Your Course
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Step 1 of 3: Choose your course of study
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
              Course
            </label>
            <CustomSelect
              value={selectedCourse}
              onChange={setSelectedCourse}
              options={courses.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select a course"
              disabled={courses.length === 0}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedCourse}
            className={`w-full rounded-lg py-3 text-sm font-semibold transition-all ${
              loading || !selectedCourse
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading ? "Saving..." : "Next: Select Semester"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CourseSelect;
