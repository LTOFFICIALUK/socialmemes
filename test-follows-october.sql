-- Test follows for October 1-5 period
-- Insert 10 follow relationships between test profiles

INSERT INTO public.follows (
  follower_id,
  following_id,
  created_at
) VALUES 
-- Sarah follows Alex (experienced trader)
(
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  '2024-10-01 16:30:22+00'
),
-- Michael follows Alex (both are DeFi focused)
(
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440001',
  '2024-10-02 10:15:45+00'
),
-- Emma follows Michael (token hunting)
(
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440003',
  '2024-10-02 17:45:30+00'
),
-- David follows Alex (Solana ecosystem)
(
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440001',
  '2024-10-03 09:20:15+00'
),
-- Lisa follows Sarah (meme community)
(
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440002',
  '2024-10-03 15:10:42+00'
),
-- James follows Michael (yield farming)
(
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440003',
  '2024-10-04 11:55:18+00'
),
-- Maria follows Lisa (NFT and art community)
(
  '550e8400-e29b-41d4-a716-446655440008',
  '550e8400-e29b-41d4-a716-446655440006',
  '2024-10-04 17:25:33+00'
),
-- Robert follows Emma (alpha calling)
(
  '550e8400-e29b-41d4-a716-446655440009',
  '550e8400-e29b-41d4-a716-446655440004',
  '2024-10-05 08:40:27+00'
),
-- Jennifer follows David (learning from experienced users)
(
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440005',
  '2024-10-05 13:15:55+00'
),
-- Jennifer also follows Lisa (meme content)
(
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440006',
  '2024-10-05 13:18:12+00'
);
