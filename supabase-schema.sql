-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  image_url TEXT,
  token_symbol TEXT,
  token_address TEXT,
  token_name TEXT,
  dex_screener_url TEXT,
  is_promoted BOOLEAN DEFAULT FALSE,
  promotion_start TIMESTAMP WITH TIME ZONE,
  promotion_end TIMESTAMP WITH TIME ZONE,
  promotion_price DECIMAL(20,9), -- SOL amount paid (supports up to 1 billion SOL with 9 decimal precision)
  payment_tx_hash TEXT, -- Solana transaction hash
  impression_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create follows table
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create likes table
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure either post_id or reply_id is provided, but not both
  CONSTRAINT likes_post_or_reply CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR 
    (post_id IS NULL AND reply_id IS NOT NULL)
  ),
  -- Unique constraint for posts
  UNIQUE(user_id, post_id) WHERE post_id IS NOT NULL,
  -- Unique constraint for replies
  UNIQUE(user_id, reply_id) WHERE reply_id IS NOT NULL
);

-- Create replies table
CREATE TABLE replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  parent_reply_id UUID REFERENCES replies(id) ON DELETE CASCADE, -- For endless threading
  content TEXT,
  image_url TEXT,
  token_symbol TEXT,
  token_address TEXT,
  token_name TEXT,
  dex_screener_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment')),
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create impressions table
CREATE TABLE impressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE impressions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Replies policies
CREATE POLICY "Replies are viewable by everyone" ON replies
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own replies" ON replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies" ON replies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" ON replies
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Impressions policies
CREATE POLICY "Anyone can insert impressions" ON impressions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Impressions are viewable by everyone" ON impressions
  FOR SELECT USING (true);

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, banner_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'banner_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_posts
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_replies
  BEFORE UPDATE ON replies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create follow notification
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't create notification if user is following themselves
  IF NEW.follower_id != NEW.following_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id)
    VALUES (NEW.following_id, 'follow', NEW.follower_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create like notification
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  reply_owner_id UUID;
BEGIN
  -- Handle post likes
  IF NEW.post_id IS NOT NULL THEN
    -- Get the post owner
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    
    -- Don't create notification if user is liking their own post
    IF NEW.user_id != post_owner_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, post_id)
      VALUES (post_owner_id, 'like', NEW.user_id, NEW.post_id);
    END IF;
  END IF;
  
  -- Handle reply likes
  IF NEW.reply_id IS NOT NULL THEN
    -- Get the reply owner
    SELECT user_id INTO reply_owner_id FROM replies WHERE id = NEW.reply_id;
    
    -- Don't create notification if user is liking their own reply
    IF NEW.user_id != reply_owner_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, reply_id)
      VALUES (reply_owner_id, 'like', NEW.user_id, NEW.reply_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create comment notification
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't create notification if user is commenting on their own post
  IF NEW.user_id != post_owner_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, post_id, reply_id)
    VALUES (post_owner_id, 'comment', NEW.user_id, NEW.post_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for notifications
CREATE TRIGGER on_follow_created
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION public.create_follow_notification();

CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION public.create_like_notification();

CREATE TRIGGER on_reply_created
  AFTER INSERT ON replies
  FOR EACH ROW EXECUTE FUNCTION public.create_comment_notification();

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

-- Create indexes for better performance
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX posts_token_symbol_idx ON posts(token_symbol);
CREATE INDEX posts_promotion_idx ON posts(is_promoted, promotion_end) WHERE is_promoted = TRUE;
CREATE INDEX follows_follower_id_idx ON follows(follower_id);
CREATE INDEX follows_following_id_idx ON follows(following_id);
CREATE INDEX likes_user_id_idx ON likes(user_id);
CREATE INDEX likes_post_id_idx ON likes(post_id);
CREATE INDEX replies_user_id_idx ON replies(user_id);
CREATE INDEX replies_post_id_idx ON replies(post_id);
CREATE INDEX replies_parent_reply_id_idx ON replies(parent_reply_id);
CREATE INDEX replies_created_at_idx ON replies(created_at DESC);
CREATE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX notifications_is_read_idx ON notifications(is_read);
CREATE INDEX notifications_type_idx ON notifications(type);
CREATE INDEX impressions_post_id_idx ON impressions(post_id);
CREATE INDEX impressions_user_id_idx ON impressions(user_id);
CREATE INDEX impressions_viewed_at_idx ON impressions(viewed_at DESC);

-- Create storage buckets for memes/images and banners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('memes', 'memes', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true);

-- Storage policies for memes bucket
CREATE POLICY "Anyone can view memes" ON storage.objects
  FOR SELECT USING (bucket_id = 'memes');

CREATE POLICY "Authenticated users can upload memes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'memes' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own memes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'memes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own memes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'memes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for banners bucket
CREATE POLICY "Anyone can view banners" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banners" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banners' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own banners" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'banners' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own banners" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'banners' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to get trending tokens
CREATE OR REPLACE FUNCTION get_trending_tokens(limit_count INTEGER DEFAULT 10, time_period INTERVAL DEFAULT '24 hours')
RETURNS TABLE (
  token_symbol TEXT,
  token_name TEXT,
  token_address TEXT,
  dex_screener_url TEXT,
  post_count BIGINT,
  total_likes BIGINT,
  trending_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.token_symbol,
    p.token_name,
    p.token_address,
    p.dex_screener_url,
    COUNT(p.id) as post_count,
    COALESCE(SUM(l.like_count), 0) as total_likes,
    -- Trending score: weighted combination of post count and likes
    (COUNT(p.id) * 1.0 + COALESCE(SUM(l.like_count), 0) * 0.5) as trending_score
  FROM posts p
  LEFT JOIN (
    SELECT post_id, COUNT(*) as like_count
    FROM likes
    GROUP BY post_id
  ) l ON p.id = l.post_id
  WHERE p.token_symbol IS NOT NULL 
    AND p.token_symbol != ''
    AND p.created_at >= NOW() - time_period
  GROUP BY p.token_symbol, p.token_name, p.token_address, p.dex_screener_url
  HAVING COUNT(p.id) > 0
  ORDER BY trending_score DESC, post_count DESC, total_likes DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
