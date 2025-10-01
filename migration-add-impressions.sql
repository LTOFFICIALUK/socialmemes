-- Migration: Add impressions tracking
-- Run this migration on your existing database

-- Create impressions table
CREATE TABLE impressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add impression_count to posts table
ALTER TABLE posts ADD COLUMN impression_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX impressions_post_id_idx ON impressions(post_id);
CREATE INDEX impressions_user_id_idx ON impressions(user_id);
CREATE INDEX impressions_viewed_at_idx ON impressions(viewed_at DESC);

-- Enable RLS
ALTER TABLE impressions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can insert impressions" ON impressions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Impressions are viewable by everyone" ON impressions
  FOR SELECT USING (true);

-- Function to increment impression count
CREATE OR REPLACE FUNCTION public.increment_post_impression_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET impression_count = impression_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment impression count
CREATE TRIGGER on_impression_created
  AFTER INSERT ON impressions
  FOR EACH ROW EXECUTE FUNCTION public.increment_post_impression_count();

