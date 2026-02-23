-- Add tone column to store dark/light classification for community themes
ALTER TABLE community_themes ADD COLUMN tone text;
