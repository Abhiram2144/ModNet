import { supabase } from "./supabaseClient";

/**
 * Fetch all active profile images from the database
 * @returns {Promise<Array>} Array of active profile image objects
 */
export const getActiveProfileImages = async () => {
  try {
    const { data, error } = await supabase
      .from("profile_images")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching profile images:", error);
    return [];
  }
};

/**
 * Fetch all profile image URLs (for quick access)
 * @returns {Promise<Array<string>>} Array of image URLs
 */
export const getProfileImageUrls = async () => {
  try {
    const images = await getActiveProfileImages();
    return images.map((img) => img.image_url);
  } catch (error) {
    console.error("Error fetching profile image URLs:", error);
    return [];
  }
};

/**
 * Get a random profile image from the active images
 * @returns {Promise<string|null>} Random image URL or null if none available
 */
export const getRandomProfileImage = async () => {
  try {
    const images = await getActiveProfileImages();
    if (images.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex].image_url;
  } catch (error) {
    console.error("Error fetching random profile image:", error);
    return null;
  }
};

/**
 * Get profile image by ID
 * @param {number} id - Profile image ID
 * @returns {Promise<object|null>} Profile image object or null
 */
export const getProfileImageById = async (id) => {
  try {
    const { data, error } = await supabase
      .from("profile_images")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching profile image by ID:", error);
    return null;
  }
};
