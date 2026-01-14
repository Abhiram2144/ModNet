import { supabase } from "./supabaseClient";

/**
 * Message Operations with GDPR Compliance
 * - Soft delete (sets deleted_at timestamp)
 * - Edit tracking (updates edited_at timestamp)
 * - Consent checking
 */

// =====================================================
// MESSAGE CRUD OPERATIONS
// =====================================================

/**
 * Fetch messages for a module (excludes soft-deleted)
 */
export async function fetchModuleMessages(moduleId) {
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      id, created_at, content, attachment_url, attachment_name, 
      userid, reply_to_id, edited_at,
      students:userid (displayname, profileimage)
    `
    )
    .eq("moduleid", moduleId)
    .is("deleted_at", null) // Exclude soft-deleted messages
    .order("created_at", { ascending: true });

  return { data, error };
}

/**
 * Fetch group messages (excludes soft-deleted)
 */
export async function fetchGroupMessages(channelId) {
  const { data, error } = await supabase
    .from("group_messages")
    .select(
      `
      id, created_at, content, attachment_url, attachment_name,
      userid, reply_to_id, edited_at,
      students:userid (displayname, profileimage)
    `
    )
    .eq("channel_id", channelId)
    .is("deleted_at", null) // Exclude soft-deleted messages
    .order("created_at", { ascending: true });

  return { data, error };
}

/**
 * Edit a message (updates content and edited_at)
 * Can only edit within 30 minutes of creation
 */
export async function editMessage(messageId, newContent, messageType = "module") {
  const table = messageType === "module" ? "messages" : "group_messages";

  const { data, error } = await supabase
    .from(table)
    .update({
      content: newContent,
      edited_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .is("deleted_at", null) // Can't edit deleted messages
    .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Within 30 minutes
    .select()
    .single();

  return { data, error };
}

/**
 * Soft delete a message (sets deleted_at timestamp)
 * Can only delete within 30 minutes of creation
 */
export async function softDeleteMessage(messageId, messageType = "module") {
  const table = messageType === "module" ? "messages" : "group_messages";

  const { data, error } = await supabase
    .from(table)
    .update({
      deleted_at: new Date().toISOString(),
      content: "[message deleted]",
    })
    .eq("id", messageId)
    .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Within 30 minutes
    .select()
    .single();

  return { data, error };
}

/**
 * Check if a message can be edited or deleted (within 30 minutes)
 */
export function canModifyMessage(messageCreatedAt) {
  const createdTime = new Date(messageCreatedAt).getTime();
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  return (now - createdTime) < thirtyMinutes;
}

// =====================================================
// FILE ATTACHMENT OPERATIONS (Signed URLs)
// =====================================================

/**
 * Upload file to private storage bucket
 * Returns the file path (NOT public URL)
 */
export async function uploadAttachment(file, userId) {
  const fileExt = file.name.split(".").pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${userId}/${uniqueName}`;

  const { data, error } = await supabase.storage
    .from("attachments")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) return { data: null, error };

  // Return the path, NOT a public URL
  return { data: { path: filePath, name: file.name }, error: null };
}

/**
 * Generate a signed URL for a private file (expires in 1 hour)
 */
export async function getSignedUrl(filePath) {
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  return { data, error };
}

/**
 * Delete a file from storage
 */
export async function deleteAttachment(filePath) {
  const { data, error } = await supabase.storage
    .from("attachments")
    .remove([filePath]);

  return { data, error };
}

// =====================================================
// CONSENT CHECKING
// =====================================================

/**
 * Check if user has accepted consent
 */
export async function checkUserConsent(userId) {
  const { data, error } = await supabase
    .from("students")
    .select("consent_accepted, consent_accepted_at")
    .eq("userid", userId)
    .single();

  if (error) return { hasConsent: false, error };
  return { hasConsent: data?.consent_accepted || false, data, error: null };
}

/**
 * Accept consent (GDPR)
 */
export async function acceptConsent(userId) {
  const { data, error } = await supabase
    .from("students")
    .update({
      consent_accepted: true,
      consent_accepted_at: new Date().toISOString(),
    })
    .eq("userid", userId)
    .select()
    .single();

  return { data, error };
}

// =====================================================
// REPORTING SYSTEM
// =====================================================

/**
 * Report a message
 */
export async function reportMessage(messageId, messageType, reason, reportedBy) {
  const { data, error } = await supabase
    .from("reports")
    .insert([
      {
        message_id: messageId,
        message_type: messageType, // 'module' or 'group'
        reported_by: reportedBy, // student.id (not auth.uid)
        reason: reason,
        status: "pending",
      },
    ])
    .select()
    .single();

  return { data, error };
}

/**
 * Get user's reports
 */
export async function getUserReports(studentId) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("reported_by", studentId)
    .order("created_at", { ascending: false });

  return { data, error };
}

// =====================================================
// ACCOUNT DELETION (Anonymization)
// =====================================================

/**
 * Delete user account and anonymize their messages
 * This should be called from a secure server-side function
 * or Edge Function with service_role key
 */
export async function deleteUserAccount(userId) {
  // Note: This function requires elevated permissions
  // It should be implemented as an Edge Function or server-side API
  // with the service_role key, NOT from client-side code

  console.warn(
    "deleteUserAccount should be called from server-side with service_role key"
  );

  // Placeholder - implement this in an Edge Function
  throw new Error(
    "Account deletion must be performed server-side for security"
  );
}

// =====================================================
// DATA EXPORT (GDPR Right to Access)
// =====================================================

/**
 * Export all user data (for GDPR compliance)
 */
export async function exportUserData(userId) {
  try {
    // Get student profile
    const { data: profile } = await supabase
      .from("students")
      .select("*")
      .eq("userid", userId)
      .single();

    if (!profile) throw new Error("Student profile not found");

    // Get module enrollments
    const { data: modules } = await supabase
      .from("user_modules")
      .select("*, modules(*)")
      .eq("userid", profile.id);

    // Get channel memberships
    const { data: channels } = await supabase
      .from("channel_members")
      .select("*, channels(*)")
      .eq("student_id", profile.id);

    // Get module messages
    const { data: moduleMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("userid", profile.id);

    // Get group messages
    const { data: groupMessages } = await supabase
      .from("group_messages")
      .select("*")
      .eq("userid", profile.id);

    // Get reports
    const { data: reports } = await supabase
      .from("reports")
      .select("*")
      .eq("reported_by", profile.id);

    const exportData = {
      profile,
      modules,
      channels,
      moduleMessages,
      groupMessages,
      reports,
      exportedAt: new Date().toISOString(),
    };

    return { data: exportData, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Download exported data as JSON file
 */
export function downloadExportedData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `modnet-data-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
