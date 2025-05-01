-- Add new columns to schools table
ALTER TABLE IF EXISTS schools
ADD COLUMN IF NOT EXISTS parent_school_id INTEGER REFERENCES schools(id),
ADD COLUMN IF NOT EXISTS is_sub_campus BOOLEAN DEFAULT FALSE;

-- Create user_schools table
CREATE TABLE IF NOT EXISTS user_schools (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    school_id INTEGER NOT NULL REFERENCES schools(id),
    is_main_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    role TEXT DEFAULT 'editor',
    can_edit_posts BOOLEAN DEFAULT TRUE,
    can_manage_faculty BOOLEAN DEFAULT TRUE,
    can_manage_inquiries BOOLEAN DEFAULT TRUE,
    can_manage_settings BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_schools_user_id ON user_schools(user_id);
CREATE INDEX IF NOT EXISTS idx_user_schools_school_id ON user_schools(school_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_schools_user_school ON user_schools(user_id, school_id);