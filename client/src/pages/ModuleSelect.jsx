import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { X } from "lucide-react";
import CustomSelect from "../components/CustomSelect";

const ModulesSelect = () => {
  const [modules, setModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUserModules, setProfile, profile } = useAuth();
  const semester = profile?.semester || "summer";
  const selectedCourse = profile?.courseid;

  // Check if course and semester are selected, redirect if not
  useEffect(() => {
    if (!selectedCourse || !semester) {
      navigate("/course-select");
    }
  }, [selectedCourse, semester, navigate]);

  // Fetch modules for selected course and semester
  useEffect(() => {
    const fetchModules = async () => {
      if (!selectedCourse || !semester) return;

      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", selectedCourse)
        .eq("semester", semester)
        .order("name");

      if (error) {
        console.error("Error fetching modules:", error);
        setError("Failed to load modules");
      } else {
        setModules(data);
      }
    };
    fetchModules();
  }, [selectedCourse, semester]);

  const handleModuleSelect = (moduleid) => {
    if (!moduleid) return;

    // moduleid is already a string/UUID from CustomSelect
    if (selectedModules.includes(moduleid)) return;

    setSelectedModules([...selectedModules, moduleid]);
  };

  const handleRemoveModule = (moduleid) => {
    setSelectedModules(selectedModules.filter((id) => id !== moduleid));
  };

  const handleSubmit = async () => {
    if (!selectedCourse || selectedModules.length !== 4) {
      setError("Please select exactly 4 modules to continue.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Get logged-in Supabase Auth user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Authentication error. Please log in again.");
      }

      // Step 2: Find or create the student record
      let userRecord = null;

      // Try lookup by auth userid first
      const { data: byId, error: byIdErr } = await supabase
        .from("students")
        .select("id")
        .eq("userid", user.id)
        .maybeSingle();

      if (byIdErr) throw byIdErr;
      if (byId) userRecord = byId;

      // Fallback: try lookup by email
      if (!userRecord) {
        const { data: byEmail, error: byEmailErr } = await supabase
          .from("students")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (byEmailErr) throw byEmailErr;

        if (byEmail) {
          // Attach auth userid to the existing student row
          const { error: attachErr } = await supabase
            .from("students")
            .update({ userid: user.id })
            .eq("id", byEmail.id);
          if (attachErr) throw attachErr;
          userRecord = { id: byEmail.id };
        }
      }

      // If still not found, create a new student record
      if (!userRecord) {
        const displayname =
          user.user_metadata?.name || user.email?.split("@")[0] || "New User";
        const { data: newRow, error: insertErr } = await supabase
          .from("students")
          .insert({ userid: user.id, email: user.email, displayname, semester })
          .select("id")
          .maybeSingle();

        if (insertErr) throw insertErr;
        userRecord = newRow;
      }

      // Step 3: Update selected course and semester
      const { error: updateError } = await supabase
        .from("students")
        .update({
          courseid: selectedCourse,
          semester: semester
        })
        .eq("id", userRecord.id);

      if (updateError) throw updateError;

      // Step 4: Delete existing modules for this semester (in case changing semester)
      const { error: deleteError } = await supabase
        .from("user_modules")
        .delete()
        .eq("userid", userRecord.id)
        .eq("semester", semester);

      if (deleteError) throw deleteError;

      // Step 5: Insert user_modules entries
      const userModules = selectedModules.map((modId) => ({
        userid: userRecord.id,
        moduleid: modId,
        semester: semester
      }));

      const { error: insertError } = await supabase
        .from("user_modules")
        .insert(userModules);

      if (insertError) throw insertError;

      // Update AuthContext so other pages (like Home) see the new modules immediately
      try {
        const formatted = modules.filter((m) => selectedModules.includes(m.id));
        if (setUserModules) setUserModules(formatted);
        if (setProfile) {
          setProfile((p) => ({ ...(p || {}), courseid: selectedCourse, semester }));
        }
      } catch (err) {
        console.warn("Failed to update auth context after module save:", err);
      }

      // Check if user has already accepted consent
      const { data: studentData } = await supabase
        .from("students")
        .select("consent_accepted")
        .eq("id", userRecord.id)
        .single();

      if (studentData?.consent_accepted) {
        navigate("/home");
      } else {
        navigate("/consent");
      }
    } catch (err) {
      console.error("❌ Error saving module selections:", err);
      setError(`Something went wrong while saving your preferences: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/semester-select");
  };

  return (
    <div className="font-inter flex min-h-screen items-center justify-center bg-[#F2EFE8] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-gray-900">
            Select Your Modules
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Step 3 of 3: Choose modules for {semester === "summer" ? "Summer" : "Winter"} semester
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Modules Dropdown */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Modules (Select at least one)
          </label>
          {modules.length === 0 ? (
            <p className="text-sm text-gray-500">Loading modules...</p>
          ) : (
            <CustomSelect
              value=""
              onChange={handleModuleSelect}
              options={modules.map(m => ({ value: m.id, label: `${m.code} - ${m.name}` }))}
              placeholder="Select a module"
            />
          )}

          {/* Selected Modules */}
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedModules.map((modId) => {
              const mod = modules.find((m) => m.id === modId);
              return (
                <div
                  key={modId}
                  className="flex items-center rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-900"
                >
                  <span>{mod?.code} - {mod?.name || "Unknown module"}</span>
                  <button
                    type="button"
                    className="ml-2 text-blue-600 hover:text-red-600"
                    onClick={() => handleRemoveModule(modId)}
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mb-4 text-center text-xs text-gray-600">
          You must select exactly 4 modules. You can change your semester later in Account settings.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-full rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedModules.length !== 4}
            className={`w-full rounded-lg py-3 text-sm font-semibold transition-all ${
              loading || selectedModules.length !== 4
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading ? "Saving..." : `Next: Review Terms (${selectedModules.length}/4)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModulesSelect;
