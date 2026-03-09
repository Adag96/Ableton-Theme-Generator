// Supabase Edge Function — triggered by Database Webhook on DELETE from community_themes
// Automatically removes orphaned storage files when a theme row is deleted.
//
// Setup:
//   1. Deploy this function: supabase functions deploy cleanup-storage
//   2. Set secrets: supabase secrets set SERVICE_ROLE_KEY=<your-service-role-key>
//   3. Create a Database Webhook in the Supabase dashboard:
//      - Table: community_themes
//      - Event: DELETE
//      - Type: Supabase Edge Functions
//      - Function: cleanup-storage

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

/**
 * Extracts the bucket name and file path from a Supabase storage public URL.
 * Example URL: https://xxx.supabase.co/storage/v1/object/public/theme-files/user-id/file.ask
 */
function extractStoragePath(url: string | null): { bucket: string; path: string } | null {
  if (!url) return null;
  try {
    const match = new URL(url).pathname.match(/^\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
    return match ? { bucket: match[1], path: match[2] } : null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  try {
    const payload = await req.json();
    const oldRecord = payload.old_record;

    if (!oldRecord) {
      return new Response('No old_record data in payload', { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const urls = [
      oldRecord.ask_file_url,
      oldRecord.source_image_url,
      oldRecord.preview_image_url
    ];

    const deleted: string[] = [];
    const failed: string[] = [];

    for (const url of urls) {
      const info = extractStoragePath(url);
      if (info) {
        const { error } = await supabase.storage.from(info.bucket).remove([info.path]);
        if (error) {
          console.error(`Failed to delete ${info.bucket}/${info.path}:`, error.message);
          failed.push(`${info.bucket}/${info.path}`);
        } else {
          deleted.push(`${info.bucket}/${info.path}`);
        }
      }
    }

    console.log(`Cleaned up storage for theme ${oldRecord.id}: deleted ${deleted.length} files`);
    if (failed.length > 0) {
      console.warn(`Failed to delete: ${failed.join(', ')}`);
    }

    return new Response(JSON.stringify({ success: true, deleted, failed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    return new Response(`Error: ${err}`, { status: 500 });
  }
});
