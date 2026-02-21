#!/bin/bash

# Replace this with your actual anon key
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtza2Viemh4cm9pc25ubnJzbHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1Mzk1OTMsImV4cCI6MjA4NzExNTU5M30.0LvpKAUYKcbp12OvEvnYvV3i4jaizJtNArKF6FfZsrc"

curl -X POST \
  "https://kskebzhxroisnnnrslqh.supabase.co/functions/v1/notify-submission" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"record":{"id":"test-123","name":"Test Theme","description":"Testing","user_id":"test-user"}}'
