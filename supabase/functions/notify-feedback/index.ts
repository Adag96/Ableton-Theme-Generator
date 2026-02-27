// Supabase Edge Function — triggered by Database Webhook on INSERT to feedback
// Sends an email notification via Resend when new feedback is submitted.
//
// Setup:
//   1. Deploy this function: supabase functions deploy notify-feedback
//   2. Set secrets: supabase secrets set RESEND_API_KEY=re_xxx NOTIFY_EMAIL=your@email.com
//   3. Create a Database Webhook in the Supabase dashboard:
//      - Table: feedback
//      - Event: INSERT
//      - URL: https://<project-ref>.supabase.co/functions/v1/notify-feedback

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL')!;

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Minor',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    const typeLabel = record.type === 'bug' ? 'Bug Report' : 'Feature Request';
    const priorityLabel = PRIORITY_LABELS[record.priority] || `${record.priority}`;

    // Format OS info if present
    let osInfoHtml = '';
    if (record.os_info) {
      const os = record.os_info;
      const platformLabel =
        os.platform === 'darwin' ? 'macOS' :
        os.platform === 'win32' ? 'Windows' :
        os.platform;
      osInfoHtml = `
        <h3>System Information</h3>
        <ul>
          <li><strong>Platform:</strong> ${platformLabel}</li>
          <li><strong>OS Version:</strong> ${os.osVersion}</li>
          <li><strong>Architecture:</strong> ${os.arch}</li>
          <li><strong>App Version:</strong> ${os.appVersion}</li>
        </ul>
      `;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@lonebodymusic.com',
        to: NOTIFY_EMAIL,
        subject: `[${typeLabel}] ${record.title}`,
        html: `
          <h2>${typeLabel}: ${record.title}</h2>
          <p><strong>Priority:</strong> ${priorityLabel}</p>
          <p><strong>User ID:</strong> ${record.user_id}</p>
          <p><strong>App Version:</strong> ${record.app_version}</p>
          <h3>Description</h3>
          <p>${record.description.replace(/\n/g, '<br>')}</p>
          ${osInfoHtml}
          <p>
            <a href="https://supabase.com/dashboard">View in Supabase dashboard</a>
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
