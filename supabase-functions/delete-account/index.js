// Supabase Edge Function for secure account deletion
// Deploy this to Supabase: supabase functions deploy delete-account

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service_role key (has admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authenticated user from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Starting account deletion for user: ${user.id}`);

    // 1. Get student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("userid", user.id)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: "Student profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Anonymize module messages
    const { error: msgAnonymizeError } = await supabaseAdmin
      .from("messages")
      .update({
        userid: null,
        content: "[deleted user]",
        attachment_url: null,
        attachment_name: null,
      })
      .eq("userid", student.id);

    if (msgAnonymizeError) {
      console.error("Failed to anonymize messages:", msgAnonymizeError);
    }

    // 3. Anonymize group messages
    const { error: groupMsgAnonymizeError } = await supabaseAdmin
      .from("group_messages")
      .update({
        userid: null,
        content: "[deleted user]",
        attachment_url: null,
        attachment_name: null,
      })
      .eq("userid", student.id);

    if (groupMsgAnonymizeError) {
      console.error(
        "Failed to anonymize group messages:",
        groupMsgAnonymizeError
      );
    }

    // 4. Delete file attachments from storage
    try {
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from("attachments")
        .list(user.id);

      if (!listError && files && files.length > 0) {
        const filesToDelete = files.map((f) => `${user.id}/${f.name}`);
        const { error: deleteFilesError } = await supabaseAdmin.storage
          .from("attachments")
          .remove(filesToDelete);

        if (deleteFilesError) {
          console.error("Failed to delete files:", deleteFilesError);
        }
      }
    } catch (storageError) {
      console.error("Storage cleanup error:", storageError);
    }

    // 5. Delete related records
    await supabaseAdmin.from("user_modules").delete().eq("userid", student.id);
    await supabaseAdmin
      .from("channel_members")
      .delete()
      .eq("student_id", student.id);
    await supabaseAdmin.from("reports").delete().eq("reported_by", student.id);

    // 6. Delete student profile
    const { error: deleteProfileError } = await supabaseAdmin
      .from("students")
      .delete()
      .eq("id", student.id);

    if (deleteProfileError) {
      console.error("Failed to delete profile:", deleteProfileError);
      return new Response(
        JSON.stringify({ error: "Failed to delete profile" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 7. Delete auth user (final step)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (deleteAuthError) {
      console.error("Failed to delete auth user:", deleteAuthError);
      return new Response(
        JSON.stringify({ error: "Failed to delete authentication" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Account deletion completed for user: ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Account deletion error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
