-- Update all pro_subscriptions created_at dates to October 4th, 2025
-- This updates the test data to have consistent dates for testing

UPDATE public.pro_subscriptions 
SET created_at = '2025-10-04 00:00:00.000000+00'
WHERE id IN (
  '0ca2b639-4b68-443f-babb-3ffea60c5d90',
  '17a89ad3-7d51-4f61-acee-3f144be33ff7',
  '35e7f16d-c8e7-462f-8740-74abd0e79216',
  '5bec030b-8c7b-425a-9168-2849323d9bb5',
  'c3e44a6f-3d14-4b02-82c6-fa05b009801b',
  'dc47fe19-40ee-4817-9083-7b74035cdf2c',
  'f8aa294b-f9e1-4670-b510-eefe2c14dddc'
);

-- Verify the update
SELECT id, user_id, price_sol, status, created_at 
FROM public.pro_subscriptions 
WHERE id IN (
  '0ca2b639-4b68-443f-babb-3ffea60c5d90',
  '17a89ad3-7d51-4f61-acee-3f144be33ff7',
  '35e7f16d-c8e7-462f-8740-74abd0e79216',
  '5bec030b-8c7b-425a-9168-2849323d9bb5',
  'c3e44a6f-3d14-4b02-82c6-fa05b009801b',
  'dc47fe19-40ee-4817-9083-7b74035cdf2c',
  'f8aa294b-f9e1-4670-b510-eefe2c14dddc'
)
ORDER BY created_at;
