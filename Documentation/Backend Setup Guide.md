# Backend Setup Guide

Step-by-step instructions for setting up the Supabase backend that powers the Community Gallery. You only need to do this once.

---

## What You're Setting Up

- A **Postgres database** with two tables (`profiles`, `community_themes`)
- **Row-level security** so the anon key is safe to ship in the app
- Two **storage buckets** for `.ask` files and preview images
- An **email notification** when someone submits a theme (optional but recommended)

Total time: ~20 minutes.

---

## Step 1: Create a Supabase Account and Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project**
3. Fill in:
   - **Name:** `ableton-theme-generator` (or anything you like)
   - **Database Password:** Generate a strong one and save it somewhere safe
   - **Region:** Pick the one closest to you
4. Click **Create new project** and wait ~2 minutes for it to provision

---

## Step 2: Run the Database Migration

This creates the tables, types, security rules, and helper functions.

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/migrations/001_community.sql` from this repository
4. Copy the entire contents and paste them into the SQL editor
5. Click **Run** (the green button)

You should see `Success. No rows returned` at the bottom. If you see an error, read it carefully — the most common issue is running this twice (the `create type` line will fail if the type already exists; just comment it out and re-run).

**What this SQL does:**
- Creates the `profiles` table for user accounts
- Creates the `community_themes` table for theme submissions
- Creates a `theme_status` enum type (`pending`, `approved`, `rejected`)
- Enables Row Level Security with appropriate policies
- Creates the `increment_download_count` function

---

## Step 3: Create Storage Buckets

You need two buckets: one for `.ask` files and one for preview screenshots.

### Bucket 1: theme-files

1. Click **Storage** in the left sidebar
2. Click **New bucket**
3. Name it exactly: `theme-files`
4. Toggle **Public bucket** ON
5. Click **Create bucket**

### Bucket 2: theme-previews

1. Click **New bucket** again
2. Name it exactly: `theme-previews`
3. Toggle **Public bucket** ON
4. Click **Create bucket**

### Storage Policies

You need to add a policy so authenticated users can upload to `theme-files`.

1. Click on the `theme-files` bucket
2. Click the **Policies** tab
3. Click **New policy** → **For full customization**
4. Fill in:
   - **Policy name:** `authenticated users can upload`
   - **Allowed operation:** INSERT
   - **Target roles:** `authenticated`
   - **Policy definition:** `(auth.uid() = (storage.foldername(name))[1]::uuid)`
5. Click **Review** then **Save policy**

This ensures users can only upload to their own folder (`theme-files/{their-user-id}/...`).

> The `theme-previews` bucket doesn't need an upload policy from the app — you'll upload screenshots manually from the Supabase dashboard.

---

## Step 4: Get Your API Keys and Configure the App

1. In the Supabase dashboard, click **Project Settings** (gear icon) → **API**
2. You'll see two values you need:
   - **Project URL** — looks like `https://abcdefghijklm.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

3. Open the `.env` file in the root of this repository
4. Replace the placeholder values:

```
VITE_SUPABASE_URL=https://your-actual-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

> **Important:** Never commit `.env` to git. It's already in `.gitignore`, so this is handled automatically.

5. Run `npm run dev` and navigate to the Community tab — it should load without errors (it'll just be empty for now)

---

## Step 5: Set Up Email Notifications (Optional)

This sends you an email whenever someone submits a theme. Skip this if you'd rather just check the dashboard periodically.

### 5a: Get a Resend API Key

1. Go to [resend.com](https://resend.com) and sign up (free tier: 100 emails/day)
2. Click **API Keys** → **Create API Key**
3. Name it `supabase-notifications` and copy the key

### 5b: Deploy the Edge Function

In your terminal, from the project root:

```bash
# Install Supabase CLI if you don't have it
brew install supabase/tap/supabase

# Log in
supabase login

# Link to your project (find your project ref in Settings → General)
supabase link --project-ref your-project-ref

# Set the secrets the function needs
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set NOTIFY_EMAIL=your@email.com

# Deploy the function
supabase functions deploy notify-submission
```

### 5c: Create the Database Webhook

1. In the Supabase dashboard, click **Database** → **Webhooks**
2. Click **Create a new hook**
3. Fill in:
   - **Name:** `notify-on-submission`
   - **Table:** `community_themes`
   - **Events:** INSERT only
   - **Webhook URL:** `https://your-project-ref.supabase.co/functions/v1/notify-submission`
   - **HTTP Method:** POST
   - **HTTP Headers:** Add `Authorization: Bearer your-anon-key`
4. Click **Create webhook**

---

## Step 6: Verify Everything Works

1. Launch the app with `npm run dev`
2. Go to **Community**
3. Click **Sign In** → create an account
4. Go to **My Themes**, open any theme, click **Share**
5. Fill in the submission form and submit
6. Check the Supabase dashboard → **Table Editor** → `community_themes`
   - You should see a row with `status: pending`
7. Check the `theme-files` storage bucket
   - You should see the `.ask` file uploaded under your user ID folder

---

## Day-to-Day: Approving Submissions

When someone submits a theme:

1. You'll receive an email (if you set up Step 5) or check the dashboard periodically
2. Go to **Table Editor** → `community_themes`, filter by `status = pending`
3. Click the row to see details, then copy the `ask_file_url`
4. Paste the URL in a browser to download the `.ask` file
5. Open Ableton, load the theme, take a full-screen screenshot
6. Go to **Storage** → `theme-previews` → create a `previews/` folder if it doesn't exist
7. Upload the screenshot, naming it `{theme-id}.png` (copy the `id` column from the table row)
8. Get the public URL of the uploaded image (click it → **Get URL**)
9. Back in the table row, click **Edit**:
   - Set `status` → `approved`
   - Set `preview_image_url` → paste the public URL from step 8
   - Set `approved_at` → `now()` (type this literally, Supabase evaluates it)
10. Click **Save**

The theme will appear in the gallery immediately.

To reject a theme: set `status` → `rejected` and optionally fill in `rejection_reason`.

---

## Troubleshooting

**"Failed to fetch" error in the Community view**
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` are correct
- Restart `npm run dev` after editing `.env`

**Upload fails when submitting a theme**
- Make sure the `theme-files` bucket exists and is set to Public
- Make sure the storage INSERT policy was created correctly

**Themes don't appear in gallery after approving**
- Double-check `status` is exactly `approved` (lowercase)
- Make sure the `preview_image_url` is the full public URL (starts with `https://`)

**SQL migration fails**
- If you see `type "theme_status" already exists`: comment out the `create type` line and re-run
- If you see `relation "profiles" already exists`: the migration was already run successfully
