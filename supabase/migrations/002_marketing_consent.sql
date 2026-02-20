-- Add marketing consent fields to profiles table
-- These fields track user opt-in for marketing communications

alter table profiles
  add column if not exists consent_product_updates boolean not null default false,
  add column if not exists consent_marketing boolean not null default false,
  add column if not exists consent_updated_at timestamptz;

-- Add policy for users to update their own consent
-- (Already covered by profiles_update_own policy from 001_community.sql)

-- Comment on columns for documentation
comment on column profiles.consent_product_updates is 'User opted in to receive updates about this app';
comment on column profiles.consent_marketing is 'User opted in to receive newsletter and updates about other products';
comment on column profiles.consent_updated_at is 'Timestamp when consent preferences were last changed';
