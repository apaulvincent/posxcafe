-- supabase/seed.sql

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Insert Admin User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'admin@posx.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User","role":"admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  'admin@posx.com',
  format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'admin@posx.com')::jsonb,
  'email',
  now(),
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- 2. Insert Cashier User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'cashier@posx.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Cashier User","role":"cashier","pin":"123456"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  'cashier@posx.com',
  format('{"sub":"%s","email":"%s"}', '22222222-2222-2222-2222-222222222222', 'cashier@posx.com')::jsonb,
  'email',
  now(),
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Ensure profiles exist (if there's no trigger or it didn't catch the inserts)
INSERT INTO public.profiles (id, full_name, email, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@posx.com', 'admin')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

INSERT INTO public.profiles (id, full_name, email, role, pin)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Cashier User', 'cashier@posx.com', 'cashier', '123456')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, pin = EXCLUDED.pin;
