-- Current precision/scale of unit decimal columns (expect 10,2 before migration)
SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'units'
  AND column_name IN (
    'front_m_2','depth_m_2','land_m_2','unit_size_m_2','parking_size_m_2',
    'total_size_m_2','habitable_construction_m_2',
    'unit_absorption','absorption_per_m_2',
    'total_price_usd','price_without_vatusd','price_per_m_2_usd',
    'rental_price_usd','rental_price_without_vatusd','rental_price_per_m_2_without_vatusd',
    'maintenance_total_price_m_2_usd','maintenance_price_per_m_2_usd',
    'installment_usd','income_usd',
    'bathrooms'
  )
ORDER BY column_name;

-- Overflow pre-check: absorption target (18,12) allows only 6 integer digits.
-- Both values MUST be 0 rows / max < 1,000,000 for the migration to be lossless.
SELECT
  MAX(ABS(unit_absorption))    AS max_unit_absorption,
  MAX(ABS(absorption_per_m_2)) AS max_absorption_per_m_2
FROM units;
