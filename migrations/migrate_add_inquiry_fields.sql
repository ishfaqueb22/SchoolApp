-- Add userId column to inquiries table
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Add subject column to inquiries table with default value
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Inquiry';