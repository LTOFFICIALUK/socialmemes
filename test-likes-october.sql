-- Test likes for October 1-5 period
-- Insert 10 likes on posts and replies with realistic engagement

INSERT INTO public.likes (
  user_id,
  post_id,
  reply_id,
  alpha_chat_message_id,
  created_at
) VALUES 
-- Likes on posts
-- Michael likes Alex's DeFi protocol post
(
  '550e8400-e29b-41d4-a716-446655440003',
  '660e8400-e29b-41d4-a716-446655440001',
  null,
  null,
  '2024-10-01 11:00:30+00'
),
-- Sarah likes Michael's yield farming analysis
(
  '550e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440003',
  null,
  null,
  '2024-10-02 09:45:15+00'
),
-- Emma likes David's Solana post
(
  '550e8400-e29b-41d4-a716-446655440004',
  '660e8400-e29b-41d4-a716-446655440005',
  null,
  null,
  '2024-10-03 08:15:22+00'
),
-- Lisa likes Sarah's moon post
(
  '550e8400-e29b-41d4-a716-446655440006',
  '660e8400-e29b-41d4-a716-446655440002',
  null,
  null,
  '2024-10-01 16:30:45+00'
),
-- James likes Emma's alpha alert
(
  '550e8400-e29b-41d4-a716-446655440007',
  '660e8400-e29b-41d4-a716-446655440004',
  null,
  null,
  '2024-10-02 19:00:30+00'
),

-- Likes on replies
-- Alex likes Michael's reply to his DeFi post
(
  '550e8400-e29b-41d4-a716-446655440001',
  null,
  '770e8400-e29b-41d4-a716-446655440001',
  null,
  '2024-10-01 12:00:15+00'
),
-- Sarah likes Lisa's reply to her moon post
(
  '550e8400-e29b-41d4-a716-446655440002',
  null,
  '770e8400-e29b-41d4-a716-446655440002',
  null,
  '2024-10-01 16:45:20+00'
),
-- Michael likes James's reply to his yield farming post
(
  '550e8400-e29b-41d4-a716-446655440003',
  null,
  '770e8400-e29b-41d4-a716-446655440003',
  null,
  '2024-10-02 11:15:42+00'
),
-- Emma likes Robert's reply to her alpha post
(
  '550e8400-e29b-41d4-a716-446655440004',
  null,
  '770e8400-e29b-41d4-a716-446655440009',
  null,
  '2024-10-05 10:00:25+00'
),
-- Jennifer likes David's reply to her newbie post
(
  '550e8400-e29b-41d4-a716-446655440010',
  null,
  '770e8400-e29b-41d4-a716-446655440010',
  null,
  '2024-10-05 14:30:18+00'
);
