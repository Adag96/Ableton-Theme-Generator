// Admin user IDs - hardcoded for simplicity
// Security note: This is only for UI visibility. The Supabase RLS policies
// already prevent non-service-role updates to community_themes.
// TODO: Replace with your actual Supabase user ID (found in Supabase dashboard > Authentication > Users)
const ADMIN_USER_IDS = [
  '1e386f75-53c1-4d96-a110-3b97fa1f22fd', // Lonebody user ID
];

export function isAdmin(userId: string | undefined): boolean {
  return userId !== undefined && ADMIN_USER_IDS.includes(userId);
}
