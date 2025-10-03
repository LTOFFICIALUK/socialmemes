-- Add alpha chat system for pro users
-- This creates a premium feed where pro users can create alpha content
-- and other users can subscribe to access it

-- Add alpha_chat_enabled column to profiles table
ALTER TABLE profiles ADD COLUMN alpha_chat_enabled BOOLEAN DEFAULT FALSE;

-- Create alpha_chat_members table to track subscriptions
CREATE TABLE alpha_chat_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alpha_chat_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscriber_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_price_sol DECIMAL(20,9) NOT NULL,
  subscription_duration_months INTEGER NOT NULL,
  payment_tx_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(alpha_chat_owner_id, subscriber_id)
);

-- Create alpha_chat_messages table to store feed posts
CREATE TABLE alpha_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alpha_chat_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  image_url TEXT,
  token_symbol TEXT,
  token_address TEXT,
  token_name TEXT,
  dex_screener_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX alpha_chat_members_owner_id_idx ON alpha_chat_members(alpha_chat_owner_id);
CREATE INDEX alpha_chat_members_subscriber_id_idx ON alpha_chat_members(subscriber_id);
CREATE INDEX alpha_chat_members_status_idx ON alpha_chat_members(status);
CREATE INDEX alpha_chat_members_expires_at_idx ON alpha_chat_members(expires_at);
CREATE INDEX alpha_chat_messages_owner_id_idx ON alpha_chat_messages(alpha_chat_owner_id);
CREATE INDEX alpha_chat_messages_author_id_idx ON alpha_chat_messages(author_id);
CREATE INDEX alpha_chat_messages_created_at_idx ON alpha_chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE alpha_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpha_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alpha_chat_members
CREATE POLICY "Users can view their own alpha chat memberships" ON alpha_chat_members
  FOR SELECT USING (auth.uid() = subscriber_id);

CREATE POLICY "Alpha chat owners can view their subscribers" ON alpha_chat_members
  FOR SELECT USING (auth.uid() = alpha_chat_owner_id);

CREATE POLICY "System can insert alpha chat memberships" ON alpha_chat_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update alpha chat memberships" ON alpha_chat_members
  FOR UPDATE WITH CHECK (true);

-- RLS Policies for alpha_chat_messages
CREATE POLICY "Alpha chat messages are viewable by subscribers and owner" ON alpha_chat_messages
  FOR SELECT USING (
    auth.uid() = alpha_chat_owner_id OR
    EXISTS (
      SELECT 1 FROM alpha_chat_members 
      WHERE alpha_chat_owner_id = alpha_chat_messages.alpha_chat_owner_id 
        AND subscriber_id = auth.uid() 
        AND status = 'active' 
        AND expires_at > NOW()
    )
  );

CREATE POLICY "Subscribers and owner can post alpha chat messages" ON alpha_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = alpha_chat_owner_id OR
    EXISTS (
      SELECT 1 FROM alpha_chat_members 
      WHERE alpha_chat_owner_id = alpha_chat_messages.alpha_chat_owner_id 
        AND subscriber_id = auth.uid() 
        AND status = 'active' 
        AND expires_at > NOW()
    )
  );

CREATE POLICY "Authors can update their own alpha chat messages" ON alpha_chat_messages
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own alpha chat messages" ON alpha_chat_messages
  FOR DELETE USING (auth.uid() = author_id);

-- Function to update updated_at timestamp for alpha_chat_messages
CREATE TRIGGER handle_updated_at_alpha_chat_messages
  BEFORE UPDATE ON alpha_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to check if user has active alpha chat subscription
CREATE OR REPLACE FUNCTION has_active_alpha_subscription(owner_id UUID, subscriber_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM alpha_chat_members 
    WHERE alpha_chat_owner_id = owner_id 
      AND subscriber_id = subscriber_id 
      AND status = 'active' 
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get alpha chat subscription status
CREATE OR REPLACE FUNCTION get_alpha_subscription_status(owner_id UUID, subscriber_id UUID)
RETURNS TEXT AS $$
DECLARE
  subscription_status TEXT;
BEGIN
  SELECT status INTO subscription_status
  FROM alpha_chat_members 
  WHERE alpha_chat_owner_id = owner_id 
    AND subscriber_id = subscriber_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(subscription_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
