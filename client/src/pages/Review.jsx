import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Loader2, Star } from "lucide-react";

const ReviewPage = () => {
  const [userData, setUserData] = useState(null);
  const [review, setReview] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) throw new Error("User not authenticated");

        // Fetch user record from your `user` table
        const { data: dbUser, error } = await supabase
          .from("user")
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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (review === 0) return alert("Please select a star rating before submitting.");

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("user")
        .update({
          review: review,
          suggestion: suggestion,
          canreview: false, // ✅ correct column name
        })
        .eq("email", userData.email);

      if (error) throw error;

      setSubmitted(true);
    } catch (err) {
      console.error("❌ Error submitting review:", err.message);
      alert("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Loading...
      </div>
    );

  if (!userData)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Unable to load user data.
      </div>
    );

  if (!userData.canreview || submitted)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-6 bg-black text-white">
        <h2 className="text-2xl font-semibold mb-3">Thank You!</h2>
        <p className="text-gray-400 max-w-md">
          You’ve already submitted your feedback.  
          Your input helps ModNet evolve into a better platform.
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg bg-neutral-900 rounded-2xl p-6 border border-gray-800 shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Share Your Feedback</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* STAR RATING */}
          <div className="flex flex-col items-center">
            <label className="text-sm text-gray-400 mb-3">
              How was your experience?
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  onClick={() => setReview(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className={`w-8 h-8 cursor-pointer transition-transform duration-150 ${
                    star <= (hover || review)
                      ? "text-yellow-400 scale-110"
                      : "text-gray-600"
                  }`}
                  fill={star <= (hover || review) ? "#facc15" : "none"}
                />
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {review === 0
                ? "Tap a star to rate"
                : `You rated ${review} star${review > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* SUGGESTION FIELD */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Any suggestions for improvement? (Optional)
            </label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="How can we make ModNet better?"
              className="w-full h-24 bg-black border border-gray-700 rounded-xl p-3 text-sm text-gray-200 resize-none focus:outline-none focus:border-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`mt-4 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
              submitting
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-black hover:bg-white"
            }`}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewPage;
