-- Test profiles for October 1-5 period
-- Insert 10 test profiles with realistic data
-- Note: These profiles use fixed UUIDs for testing purposes

-- First, we need to create auth users (this might require admin access)
-- For testing purposes, we'll create profiles directly and assume auth users exist
-- If you get foreign key errors, you may need to create auth users first

INSERT INTO public.profiles (
  id,
  username,
  full_name,
  bio,
  avatar_url,
  created_at,
  banner_url,
  referral_code,
  referral_link,
  pro,
  alpha_chat_enabled,
  payout_wallet_address
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'crypto_trader_2024',
  'Alex Johnson',
  'DeFi enthusiast and crypto trader 📈 | Building the future of finance',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  '2024-10-01 09:15:30+00',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=200&fit=crop',
  'ALEX2024',
  'https://socialmemes.com/ref/ALEX2024',
  true,
  true,
  '9WzDXwBbmkg8ZTbNMqUxvQyxyrEAcn6hH5d2Y9oQ'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'moon_girl',
  'Sarah Chen',
  '🚀 To the moon! | Meme coin hunter | NFT collector',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  '2024-10-01 14:22:15+00',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=200&fit=crop',
  'SARAH2024',
  'https://socialmemes.com/ref/SARAH2024',
  false,
  false,
  '8VxCYwAaljf7YTaOMpTywQxyqEDbnmhG4e1Y8nP'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'defi_master',
  'Michael Rodriguez',
  'DeFi protocols researcher | Yield farming expert | Smart contract developer',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  '2024-10-02 11:45:22+00',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=200&fit=crop',
  'MIKE2024',
  'https://socialmemes.com/ref/MIKE2024',
  true,
  true,
  '7UwBXv9zki6XSaNLnqSxvPwxpDCamlfF3d0X7mO'
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'token_hunter',
  'Emma Wilson',
  'Early stage token hunter 🔍 | Community manager | Alpha calls',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  '2024-10-02 16:30:45+00',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=200&fit=crop',
  'EMMA2024',
  'https://socialmemes.com/ref/EMMA2024',
  false,
  false,
  '6TvAWu8yjh5WSaMKmpRwuOvwoCBZlkfE2c9W6lN'
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'solana_king',
  'David Kim',
  'Solana ecosystem builder | Validator | $SOL maxi',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  '2024-10-03 08:20:10+00',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=200&fit=crop',
  'DAVID2024',
  'https://socialmemes.com/ref/DAVID2024',
  true,
  false,
  '5SuAVt7xig4VRaLLlqQvtNuvoBAYkjfD1b8V5kM'
),
(
  '550e8400-e29b-41d4-a716-446655440006',
  'meme_queen',
  'Lisa Thompson',
  'Meme coin queen 👑 | Viral content creator | Community builder',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
  '2024-10-03 13:55:33+00',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=200&fit=crop',
  'LISA2024',
  'https://socialmemes.com/ref/LISA2024',
  false,
  true,
  '4Rt9Us6whf3UQaKKkpQusMtnuAZXjkfC0a7U4jL'
),
(
  '550e8400-e29b-41d4-a716-446655440007',
  'yield_farmer',
  'James Brown',
  'Yield farming strategist | Liquidity provider | Risk management expert',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  '2024-10-04 10:12:18+00',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=200&fit=crop',
  'JAMES2024',
  'https://socialmemes.com/ref/JAMES2024',
  true,
  true,
  '3Qs8Tr5vge2TPbJJjqPtsLsmnZYWijkfB9b8T3kK'
),
(
  '550e8400-e29b-41d4-a716-446655440008',
  'nft_collector',
  'Maria Garcia',
  'NFT collector & curator | Digital art enthusiast | Metaverse explorer',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
  '2024-10-04 15:40:27+00',
  'https://images.unsplash.com/photo-1515378791036-0648a814c963?w=800&h=200&fit=crop',
  'MARIA2024',
  'https://socialmemes.com/ref/MARIA2024',
  false,
  false,
  '2Pr7Sq4ufd1SOaIIipOssKrlNYXhijkfA8a7S2jJ'
),
(
  '550e8400-e29b-41d4-a716-446655440009',
  'alpha_caller',
  'Robert Davis',
  'Alpha caller & researcher | Early project discoverer | Community leader',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  '2024-10-05 07:25:14+00',
  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=200&fit=crop',
  'ROBERT2024',
  'https://socialmemes.com/ref/ROBERT2024',
  true,
  true,
  '1Oq6Rp3tec0RNAHHhoNrrJqkMXWghijkfB7a6R1iI'
),
(
  '550e8400-e29b-41d4-a716-446655440010',
  'crypto_newbie',
  'Jennifer Lee',
  'New to crypto but learning fast! 📚 | Following the community',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
  '2024-10-05 12:18:42+00',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=200&fit=crop',
  'JENNY2024',
  'https://socialmemes.com/ref/JENNY2024',
  false,
  false,
  '0Np5Qo2sdb9QMBGGgnMrrIpkLWVfgijkfC6a5Q0hH'
);

-- Set up some referral relationships
UPDATE public.profiles 
SET referred_by = '550e8400-e29b-41d4-a716-446655440001'
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

UPDATE public.profiles 
SET referred_by = '550e8400-e29b-41d4-a716-446655440003'
WHERE id = '550e8400-e29b-41d4-a716-446655440004';

UPDATE public.profiles 
SET referred_by = '550e8400-e29b-41d4-a716-446655440005'
WHERE id = '550e8400-e29b-41d4-a716-446655440006';
