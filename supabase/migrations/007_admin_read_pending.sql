-- Allow admin user to read all community themes (including pending from other users)
-- This is needed for the Admin Panel to review theme submissions

create policy "admin_select_all_themes" on community_themes
  for select using (
    auth.uid() = '1e386f75-53c1-4d96-a110-3b97fa1f22fd'::uuid
  );

-- Allow admin user to update any community theme (for approve/reject actions)
create policy "admin_update_all_themes" on community_themes
  for update using (
    auth.uid() = '1e386f75-53c1-4d96-a110-3b97fa1f22fd'::uuid
  );
