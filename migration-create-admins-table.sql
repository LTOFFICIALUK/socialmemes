-- Create admins table for admin access control
-- This table will store user IDs that have admin privileges

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies for admins table
-- Only admins can view the admins table
CREATE POLICY "Admins can view admins table" ON admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Only admins can insert new admins
CREATE POLICY "Admins can insert new admins" ON admins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Only admins can update admin records
CREATE POLICY "Admins can update admin records" ON admins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Only admins can delete admin records
CREATE POLICY "Admins can delete admin records" ON admins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = user_uuid 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;

-- Add a comment to the table
COMMENT ON TABLE admins IS 'Table storing admin user privileges for the application';
COMMENT ON COLUMN admins.user_id IS 'Reference to the user in auth.users';
COMMENT ON COLUMN admins.created_by IS 'Admin who granted admin access to this user';
COMMENT ON COLUMN admins.is_active IS 'Whether this admin access is currently active';
COMMENT ON COLUMN admins.permissions IS 'JSON object storing specific permissions for this admin';
