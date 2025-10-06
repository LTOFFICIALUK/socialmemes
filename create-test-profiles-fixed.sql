-- Create test profiles for platform revenue testing
-- This script creates sample user profiles that can be used for Featured Tokens and Pro Subscriptions

-- Create 25 test profiles with correct schema
INSERT INTO profiles (
  id,
  username,
  full_name,
  bio,
  avatar_url,
  pro,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'crypto_trader_1',
  'Crypto Trader 1',
  'Professional crypto trader and token promoter',
  'https://example.com/avatar1.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'token_promoter_2',
  'Token Promoter 2',
  'Marketing expert for crypto tokens',
  'https://example.com/avatar2.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'solana_maxi_3',
  'Solana Maximalist',
  'Solana ecosystem enthusiast and investor',
  'https://example.com/avatar3.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'defi_yield_4',
  'DeFi Yield Farmer',
  'DeFi protocols and yield optimization specialist',
  'https://example.com/avatar4.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'nft_collector_5',
  'NFT Collector',
  'Digital art and NFT collector',
  'https://example.com/avatar5.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'memecoin_king_6',
  'Memecoin King',
  'Memecoin expert and community builder',
  'https://example.com/avatar6.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'crypto_influencer_7',
  'Crypto Influencer',
  'Blockchain influencer and content creator',
  'https://example.com/avatar7.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'token_launcher_8',
  'Token Launcher',
  'Token creation and launch specialist',
  'https://example.com/avatar8.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'solana_builder_9',
  'Solana Builder',
  'Solana dApp developer and ecosystem contributor',
  'https://example.com/avatar9.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'crypto_analyst_10',
  'Crypto Analyst',
  'Technical and fundamental analysis expert',
  'https://example.com/avatar10.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'defi_researcher_11',
  'DeFi Researcher',
  'DeFi protocol researcher and analyst',
  'https://example.com/avatar11.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'nft_artist_12',
  'NFT Artist',
  'Digital artist and NFT creator',
  'https://example.com/avatar12.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'crypto_educator_13',
  'Crypto Educator',
  'Blockchain education and content creator',
  'https://example.com/avatar13.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'token_advisor_14',
  'Token Advisor',
  'Tokenomics and project advisory specialist',
  'https://example.com/avatar14.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'crypto_podcaster_15',
  'Crypto Podcaster',
  'Blockchain podcast host and commentator',
  'https://example.com/avatar15.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'solana_validator_16',
  'Solana Validator',
  'Solana network validator and infrastructure provider',
  'https://example.com/avatar16.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'defi_yield_17',
  'DeFi Yield Optimizer',
  'Yield farming and liquidity optimization expert',
  'https://example.com/avatar17.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'nft_marketplace_18',
  'NFT Marketplace',
  'NFT marketplace operator and curator',
  'https://example.com/avatar18.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'crypto_fund_19',
  'Crypto Fund',
  'Crypto investment fund manager',
  'https://example.com/avatar19.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'blockchain_dev_20',
  'Blockchain Developer',
  'Smart contract developer and auditor',
  'https://example.com/avatar20.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'crypto_trader_21',
  'Crypto Trader 21',
  'Professional crypto trader and market maker',
  'https://example.com/avatar21.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'token_marketer_22',
  'Token Marketer',
  'Crypto marketing and community management specialist',
  'https://example.com/avatar22.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'solana_evangelist_23',
  'Solana Evangelist',
  'Solana ecosystem advocate and community leader',
  'https://example.com/avatar23.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'defi_architect_24',
  'DeFi Architect',
  'DeFi protocol architect and designer',
  'https://example.com/avatar24.jpg',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'crypto_vc_25',
  'Crypto VC',
  'Crypto venture capitalist and investor',
  'https://example.com/avatar25.jpg',
  true,
  NOW(),
  NOW()
);

-- Verify profiles were created
SELECT COUNT(*) as total_profiles FROM profiles;
