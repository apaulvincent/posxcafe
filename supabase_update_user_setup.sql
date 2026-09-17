-- Create a secure function to allow admins to update other users' emails and passwords
CREATE OR REPLACE FUNCTION admin_update_user_credentials(
  p_user_id UUID,
  p_email TEXT,
  p_password TEXT
) RETURNS void AS $$
BEGIN
  -- 1. Ensure the user calling this is an admin or manager
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 2. Update email if provided
  IF p_email IS NOT NULL AND p_email != '' THEN
    UPDATE auth.users 
    SET email = p_email, email_confirmed_at = now() 
    WHERE id = p_user_id;
  END IF;

  -- 3. Update password if provided
  IF p_password IS NOT NULL AND p_password != '' THEN
    UPDATE auth.users 
    SET encrypted_password = crypt(p_password, gen_salt('bf')) 
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
