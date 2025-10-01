-- Migration: Add featured_tokens table
-- Run this in your Supabase SQL editor

-- Create featured_tokens table
CREATE TABLE featured_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  image_url TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  promotion_start TIMESTAMP WITH TIME ZONE,
  promotion_end TIMESTAMP WITH TIME ZONE,
  promotion_price DECIMAL(20,9), -- SOL amount paid
  payment_tx_hash TEXT, -- Solana transaction hash
  display_order INTEGER DEFAULT 0, -- Lower numbers show first
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE featured_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for featured_tokens
CREATE POLICY "Featured tokens are viewable by everyone" ON featured_tokens
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own featured tokens" ON featured_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own featured tokens" ON featured_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own featured tokens" ON featured_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX featured_tokens_user_id_idx ON featured_tokens(user_id);
CREATE INDEX featured_tokens_active_idx ON featured_tokens(is_active, promotion_end) WHERE is_active = TRUE;
CREATE INDEX featured_tokens_created_at_idx ON featured_tokens(created_at DESC);
CREATE INDEX featured_tokens_display_order_idx ON featured_tokens(display_order);

-- Trigger to update updated_at timestamp
CREATE TRIGGER handle_updated_at_featured_tokens
  BEFORE UPDATE ON featured_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket for featured token images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('featured-tokens', 'featured-tokens', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for featured-tokens bucket
CREATE POLICY "Anyone can view featured token images" ON storage.objects
  FOR SELECT USING (bucket_id = 'featured-tokens');

CREATE POLICY "Authenticated users can upload featured token images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'featured-tokens' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own featured token images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'featured-tokens' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own featured token images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'featured-tokens' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to get active featured tokens
CREATE OR REPLACE FUNCTION get_active_featured_tokens(limit_count INTEGER DEFAULT 6)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  image_url TEXT,
  destination_url TEXT,
  display_order INTEGER,
  promotion_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.id,
    ft.user_id,
    ft.title,
    ft.image_url,
    ft.destination_url,
    ft.display_order,
    ft.promotion_end
  FROM featured_tokens ft
  WHERE ft.is_active = TRUE 
    AND ft.promotion_end > NOW()
  ORDER BY ft.display_order ASC, ft.promotion_start ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table and columns
COMMENT ON TABLE featured_tokens IS 'Paid featured token promotions displayed in sidebar';
COMMENT ON COLUMN featured_tokens.title IS 'Optional display title for the featured token';
COMMENT ON COLUMN featured_tokens.image_url IS 'Square image URL for the featured token';
COMMENT ON COLUMN featured_tokens.destination_url IS 'External link when user clicks the featured token';
COMMENT ON COLUMN featured_tokens.is_active IS 'Whether this featured token is currently active';
COMMENT ON COLUMN featured_tokens.promotion_start IS 'When the promotion started';
COMMENT ON COLUMN featured_tokens.promotion_end IS 'When the promotion ends';
COMMENT ON COLUMN featured_tokens.promotion_price IS 'SOL amount paid for promotion';
COMMENT ON COLUMN featured_tokens.payment_tx_hash IS 'Solana transaction hash for the payment';
COMMENT ON COLUMN featured_tokens.display_order IS 'Display order (lower numbers show first)';

