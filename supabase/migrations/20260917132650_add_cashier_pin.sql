-- 1. Add a PIN column to the profiles table
ALTER TABLE profiles ADD COLUMN pin TEXT UNIQUE;

-- 2. Create a secure function to look up email by PIN
-- Security definer allows this function to bypass RLS so the login screen can use it
CREATE OR REPLACE FUNCTION get_email_by_pin(p_pin TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT email FROM profiles WHERE pin = p_pin LIMIT 1;
$$;
