-- Add latitude and longitude columns to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update existing restaurants with sample coordinates (Jakarta area)
UPDATE restaurants SET latitude = -6.200000, longitude = 106.816666 WHERE name = 'Warung Makan Bu Tini';
UPDATE restaurants SET latitude = -6.175110, longitude = 106.865039 WHERE name = 'Pizza Corner';
UPDATE restaurants SET latitude = -6.208763, longitude = 106.845599 WHERE name = 'Nasi Goreng Abang';
UPDATE restaurants SET latitude = -6.186486, longitude = 106.834091 WHERE name = 'Sate Pak Joko';
UPDATE restaurants SET latitude = -6.195140, longitude = 106.823311 WHERE name = 'Bakso Mas Bro';

-- Create index for faster location-based queries
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);
