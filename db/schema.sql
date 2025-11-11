-- Create users table with balance
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    saldo DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster username lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    rating DECIMAL(2, 1) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INTEGER REFERENCES restaurants(id),
    total_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- Create transactions table for balance history
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'topup', 'payment', 'refund'
    description TEXT,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample restaurants
INSERT INTO restaurants (name, description, rating) VALUES
    ('Warung Makan Bu Tini', 'Masakan rumahan dengan cita rasa autentik', 4.5),
    ('Pizza Corner', 'Pizza dan pasta terbaik di kota', 4.7),
    ('Nasi Goreng Abang', 'Nasi goreng spesial 24 jam', 4.3),
    ('Sate Pak Joko', 'Sate ayam dan kambing pilihan', 4.6),
    ('Bakso Mas Bro', 'Bakso dan mie ayam enak', 4.4)
ON CONFLICT DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
    (1, 'Nasi Ayam Goreng', 'Nasi dengan ayam goreng crispy', 25000),
    (1, 'Nasi Rendang', 'Nasi dengan rendang daging sapi', 35000),
    (1, 'Es Teh Manis', 'Es teh segar', 5000),
    (2, 'Pizza Margherita', 'Pizza klasik dengan keju mozzarella', 75000),
    (2, 'Spaghetti Carbonara', 'Pasta dengan saus creamy', 65000),
    (2, 'Garlic Bread', 'Roti bawang putih', 25000),
    (3, 'Nasi Goreng Special', 'Nasi goreng dengan telur, ayam, dan seafood', 30000),
    (3, 'Nasi Goreng Biasa', 'Nasi goreng sederhana', 20000),
    (3, 'Es Jeruk', 'Jus jeruk segar', 8000),
    (4, 'Sate Ayam 10 tusuk', 'Sate ayam dengan bumbu kacang', 35000),
    (4, 'Sate Kambing 10 tusuk', 'Sate kambing empuk', 50000),
    (4, 'Lontong', 'Lontong sebagai pendamping', 10000),
    (5, 'Bakso Spesial', 'Bakso dengan isi lengkap', 28000),
    (5, 'Mie Ayam Bakso', 'Mie ayam dengan bakso', 25000),
    (5, 'Es Campur', 'Es campur segar', 15000)
ON CONFLICT DO NOTHING;
