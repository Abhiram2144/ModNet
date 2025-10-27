import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { Loader2, Star } from "lucide-react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const ReviewPage = () => {
  const [userData, setUserData] = useState(null);
  const [review, setReview] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const { profile, setProfile } = useAuth();
  // avoid showing the loader if profile was preloaded
  const [loading, setLoading] = useState(!profile);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // If profile was preloaded in AuthContext, use it
        if (profile) {
          setUserData(profile);
          setLoading(false);
          return;
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) throw new Error("User not authenticated");

        // Fetch user record from your `students` table
        const { data: dbUser, error } = await supabase
          .from("students")
          .select("id, displayname, email, canreview, review, suggestion")
          .eq("email", user.email)
          .single();

        if (error) throw error;
        setUserData(dbUser);
      } catch (err) {
        console.error("❌ Error fetching user data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (review === 0)
      return alert("Please select a star rating before submitting.");

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("students")
        .update({
          review: review,
          suggestion: suggestion,
          canreview: false, // ✅ correct column name
        })
        .eq("email", userData.email);

      if (error) throw error;

      // update preloaded profile so other pages see the change immediately
      setSubmitted(true);
      try {
        if (setProfile) {
          setProfile({
            ...userData,
            canreview: false,
            review: review,
            suggestion: suggestion,
          });
        }
      } catch (err) {
        console.warn(
          "Failed to update preloaded profile:",
          err?.message || err,
        );
      }
    } catch (err) {
      console.error("❌ Error submitting review:", err.message);
      alert("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Loading...
      </div>
    );

  if (!userData)
    return (
      <div className="flex h-screen items-center justify-center bg-white text-gray-600">
        Unable to load user data.
      </div>
    );

  // Do not unmount the navbar/footer after submission — show the message inline
  // The UI below will render either the form or a thank-you message inside the same frame

  return (
    <div className="font-inter">
      <Navbar />
      <div className="font-inter flex min-h-screen flex-col items-center bg-[#F2EFE8] px-4 pt-16 pb-10 text-black">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold">
            Share Your Feedback
          </h1>

          {userData.canreview === false || submitted ? (
            <div className="flex flex-col items-center justify-center py-12">
              <h2 className="mb-3 text-2xl font-semibold">Thank You!</h2>
              <p className="max-w-md text-center text-gray-600">
                {submitted
                  ? "Thanks — your feedback has been submitted. Your input helps ModNet become a better platform."
                  : "You've already submitted your feedback. Your input helps ModNet evolve into a better platform."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* STAR RATING */}
              <div className="flex flex-col items-center">
                <label className="mb-3 text-sm text-gray-600">
                  How was your experience?
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => setReview(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className={`h-8 w-8 cursor-pointer transition-transform duration-150 ${
                        star <= (hover || review)
                          ? "scale-110 text-yellow-400"
                          : "text-gray-300"
                      }`}
                      fill={star <= (hover || review) ? "#facc15" : "none"}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {review === 0
                    ? "Tap a star to rate"
                    : `You rated ${review} star${review > 1 ? "s" : ""}`}
                </p>
              </div>

              {/* SUGGESTION FIELD */}
              <div>
                <label className="mb-2 block text-sm text-gray-600">
                  Any suggestions for improvement? (Optional)
                </label>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="How can we make ModNet better?"
                  className="h-24 w-full resize-none rounded-xl border border-gray-300 bg-gray-100 p-3 text-sm text-gray-800 focus:border-gray-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`mt-4 w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                  submitting
                    ? "cursor-not-allowed bg-gray-300 text-gray-500"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default ReviewPage;
