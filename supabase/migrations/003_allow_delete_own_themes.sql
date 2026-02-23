-- Allow users to delete their own community theme submissions
create policy "themes_delete_own" on community_themes
  for delete using (auth.uid() = user_id);
