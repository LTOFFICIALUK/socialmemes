-- Test replies for October 1-5 period
-- Insert 10 replies/comments on posts with realistic engagement

INSERT INTO public.replies (
  id,
  user_id,
  post_id,
  content,
  created_at,
  image_url,
  token_symbol,
  token_address,
  token_name,
  dex_screener_url,
  parent_reply_id
) VALUES 
-- Reply to Alex's DeFi protocol post
(
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440003',
  '660e8400-e29b-41d4-a716-446655440001',
  'Great find! I''ve been researching this protocol too. The smart contracts look solid and the team has a strong track record. Already staking some tokens!',
  '2024-10-01 11:45:30+00',
  null,
  null,
  null,
  null,
  null,
  null
),
-- Reply to Sarah's moon post
(
  '770e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440006',
  '660e8400-e29b-41d4-a716-446655440002',
  'MOON GANG! 🚀 I''m in too! This community is amazing and the devs are actually building something real.',
  '2024-10-01 16:20:15+00',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&h=200&fit=crop',
  'MOON',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'Moon Token',
  'https://dexscreener.com/solana/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  null
),
-- Reply to Michael's yield farming analysis
(
  '770e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440007',
  '660e8400-e29b-41d4-a716-446655440003',
  'Solid analysis! I''ve been farming this protocol for a month now. The yields have been consistent and the impermanent loss is minimal.',
  '2024-10-02 10:30:22+00',
  null,
  null,
  null,
  null,
  null,
  null
),
-- Reply to Emma's alpha alert
(
  '770e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440009',
  '660e8400-e29b-41d4-a716-446655440004',
  'Thanks for the alpha! I''ve been following this project for months. The partnerships they announced are huge. Early entry is key here!',
  '2024-10-02 19:15:45+00',
  null,
  null,
  null,
  null,
  null,
  null
),
-- Reply to David's Solana post
(
  '770e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440010',
  '660e8400-e29b-41d4-a716-446655440005',
  'Solana is definitely the future! I''m new to crypto but the speed and low fees are incredible. Learning so much from this community!',
  '2024-10-03 08:30:18+00',
  null,
  null,
  null,
  null,
  null,
  null
),
-- Reply to Lisa's frog meme post
(
  '770e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440006',
  '🐸 FROG GANG! This token has the best community vibes! The devs are always active and building new features.',
  '2024-10-03 15:45:33+00',
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop',
  'FROG',
  '9WzDXwBbmkg8ZTbNMqUxvQyxyrEAcn6hH5d2Y9oQ',
  'Frog Meme Token',
  'https://dexscreener.com/solana/9WzDXwBbmkg8ZTbNMqUxvQyxyrEAcn6hH5d2Y9oQ',
  null
),
-- Reply to James's yield farming strategy
(
  '770e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440001',
  '660e8400-e29b-41d4-a716-446655440007',
  'Excellent diversification strategy! I''ve been using similar approach but with 3 protocols. 45% APY is impressive - what''s your risk tolerance?',
  '2024-10-04 12:45:27+00',
  null,
  null,
  null,
  null,
  null,
  null
),
-- Reply to Maria's NFT post
(
  '770e8400-e29b-41d4-a716-446655440008',
  '550e8400-e29b-41d4-a716-446655440008',
  '660e8400-e29b-41d4-a716-446655440008',
  'The art in this collection is absolutely stunning! I minted 3 pieces and they''re already showing great potential. The artist has serious talent!',
  '2024-10-04 18:20:55+00',
  'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=300&h=200&fit=crop',
  'ART',
  '7UwBXv9zki6XSaNLnqSxvPwxpDCamlfF3d0X7mO',
  'Art Token',
  'https://dexscreener.com/solana/7UwBXv9zki6XSaNLnqSxvPwxpDCamlfF3d0X7mO',
  null
),
-- Reply to Robert's alpha call
(
  '770e8400-e29b-41d4-a716-446655440009',
  '550e8400-e29b-41d4-a716-446655440004',
  '660e8400-e29b-41d4-a716-446655440009',
  'This is exactly the kind of alpha I''ve been waiting for! 2 years in development with doxxed team is rare these days. Loading up!',
  '2024-10-05 09:30:12+00',
  null,
  null,
  null,
  null,
  null,
  null
),
-- Reply to Jennifer's newbie post
(
  '770e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440005',
  '660e8400-e29b-41d4-a716-446655440010',
  'Welcome to crypto! 🎉 This community is amazing for learning. Start small, do your own research, and don''t invest more than you can afford to lose. You''ve got this!',
  '2024-10-05 14:15:40+00',
  null,
  null,
  null,
  null,
  null,
  null
);
