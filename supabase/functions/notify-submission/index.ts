// Supabase Edge Function — triggered by Database Webhook on INSERT to community_themes
// Sends an email notification via Resend when a new theme is submitted.
//
// Setup:
//   1. Deploy this function: supabase functions deploy notify-submission
//   2. Set secrets: supabase secrets set RESEND_API_KEY=re_xxx NOTIFY_EMAIL=your@email.com
//   3. Create a Database Webhook in the Supabase dashboard:
//      - Table: community_themes
//      - Event: INSERT
//      - URL: https://<project-ref>.supabase.co/functions/v1/notify-submission

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL')!;

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    // Fetch submitter display name
    const submitterName = record.user_id ? `User ${record.user_id}` : 'Anonymous';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@lonebody.io',
        to: NOTIFY_EMAIL,
        subject: `New theme submission: ${record.name}`,
        html: `
          <h2>New Theme Submission</h2>
          <p><strong>Name:</strong> ${record.name}</p>
          <p><strong>Submitted by:</strong> ${submitterName}</p>
          <p><strong>Description:</strong> ${record.description ?? '(none)'}</p>
          <p><strong>Theme ID:</strong> ${record.id}</p>
          <p>
            Review in the
            <a href="https://supabase.com/dashboard">Supabase dashboard</a>.
          </p>
        `,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(`Resend error: ${text}`, { status: 500 });
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    return new Response(`Error: ${err}`, { status: 500 });
  }
});
