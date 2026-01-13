-- Authentic Hadith Database Schema
-- Constitutional hadith verification and collection platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with QBos IdentityEngine)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',
  qbos_user_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'scholar', 'moderator', 'viewer'))
);

-- Sources table (Bukhari, Muslim, etc.)
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  book_number INT,
  hadith_number INT,
  volume INT,
  authenticity_tier VARCHAR(1) NOT NULL DEFAULT 'C',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_tier CHECK (authenticity_tier IN ('A', 'B', 'C')),
  UNIQUE(name, book_number, hadith_number, volume)
);

-- Hadiths table
CREATE TABLE hadiths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_arabic TEXT NOT NULL,
  text_translation TEXT,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  chain_of_narration TEXT,
  grade VARCHAR(50) NOT NULL DEFAULT 'daif',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  imported_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_grade CHECK (grade IN ('sahih', 'hasan', 'daif', 'mawdu')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'verified', 'published', 'deleted'))
);

-- Verifications table
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hadith_id UUID REFERENCES hadiths(id) ON DELETE CASCADE,
  scholar_id UUID REFERENCES users(id) ON DELETE SET NULL,
  grade VARCHAR(50) NOT NULL,
  methodology TEXT NOT NULL,
  reasoning TEXT,
  verified_at TIMESTAMP DEFAULT NOW(),
  receipt_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_verification_grade CHECK (grade IN ('sahih', 'hasan', 'daif', 'mawdu'))
);

-- Narrators table
CREATE TABLE narrators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_arabic VARCHAR(255) NOT NULL,
  name_latin VARCHAR(255) NOT NULL,
  reliability_grade VARCHAR(20),
  birth_year INT,
  death_year INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Receipts table (local copy of QBos receipts)
CREATE TABLE receipts (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  details JSONB NOT NULL,
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_hadiths_status ON hadiths(status);
CREATE INDEX idx_hadiths_grade ON hadiths(grade);
CREATE INDEX idx_hadiths_source ON hadiths(source_id);
CREATE INDEX idx_hadiths_imported_by ON hadiths(imported_by);
CREATE INDEX idx_verifications_hadith ON verifications(hadith_id);
CREATE INDEX idx_verifications_scholar ON verifications(scholar_id);
CREATE INDEX idx_receipts_session ON receipts(session_id);
CREATE INDEX idx_receipts_type ON receipts(type);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadiths ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE narrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Anyone can read, only admins can modify
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Sources: Public read, scholars+ can write
CREATE POLICY "Sources are viewable by everyone" ON sources
  FOR SELECT USING (true);

CREATE POLICY "Scholars can create sources" ON sources
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'scholar', 'moderator'))
  );

-- Hadiths: Public read for published, restricted write
CREATE POLICY "Published hadiths are viewable by everyone" ON hadiths
  FOR SELECT USING (status = 'published' OR imported_by = auth.uid());

CREATE POLICY "Scholars can import hadiths" ON hadiths
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'scholar', 'moderator'))
  );

CREATE POLICY "Owners and admins can update hadiths" ON hadiths
  FOR UPDATE USING (
    imported_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Verifications: Public read, scholars can write
CREATE POLICY "Verifications are viewable by everyone" ON verifications
  FOR SELECT USING (true);

CREATE POLICY "Scholars can verify hadiths" ON verifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'scholar'))
  );

-- Receipts: Public read (transparency)
CREATE POLICY "Receipts are viewable by everyone" ON receipts
  FOR SELECT USING (true);

CREATE POLICY "System can write receipts" ON receipts
  FOR INSERT WITH CHECK (true);

-- Functions

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hadiths_updated_at BEFORE UPDATE ON hadiths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_narrators_updated_at BEFORE UPDATE ON narrators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to count verifications for a hadith
CREATE OR REPLACE FUNCTION count_verifications(hadith_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM verifications WHERE hadith_id = hadith_uuid;
$$ LANGUAGE SQL STABLE;

-- Function to check if hadith meets publication requirements
CREATE OR REPLACE FUNCTION can_publish_hadith(hadith_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT COUNT(*) >= 2 FROM verifications WHERE hadith_id = hadith_uuid AND grade IN ('sahih', 'hasan');
$$ LANGUAGE SQL STABLE;
