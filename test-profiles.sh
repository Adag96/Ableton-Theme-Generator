#!/bin/bash

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtza2Viemh4cm9pc25ubnJzbHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1Mzk1OTMsImV4cCI6MjA4NzExNTU5M30.0LvpKAUYKcbp12OvEvnYvV3i4jaizJtNArKF6FfZsrc"

echo "=== Testing profiles table ==="
curl -s "https://kskebzhxroisnnnrslqh.supabase.co/rest/v1/profiles?select=*" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"

echo ""
echo ""
echo "=== Testing community_themes with join ==="
curl -s "https://kskebzhxroisnnnrslqh.supabase.co/rest/v1/community_themes?select=*,profiles(display_name)&status=eq.approved" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"
