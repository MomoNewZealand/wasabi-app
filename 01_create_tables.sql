-- ============================================================
-- わさび管理システム：Supabase テーブル作成スクリプト
-- ============================================================

-- 1️⃣ ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2️⃣ 出荷先マスター
CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  unit_price DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3️⃣ 植え付けロット
CREATE TABLE IF NOT EXISTS plantings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  planted_date DATE NOT NULL,
  planted_quantity INTEGER NOT NULL,
  variety TEXT,
  status TEXT DEFAULT '生育中' CHECK (status IN ('生育中', '収穫可能', '収穫済', '廃棄')),
  harvested_date DATE,
  harvested_quantity INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4️⃣ 出荷記録
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARYKey DEFAULT gen_random_uuid(),
  planting_id UUID NOT NULL REFERENCES plantings(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
  shipment_date DATE NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2),
  total_amount DECIMAL(12, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5️⃣ 加工記録
CREATE TABLE IF NOT EXISTS processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processing_date DATE NOT NULL,
  part TEXT NOT NULL,
  weight_before DECIMAL(10, 2) NOT NULL,
  weight_after DECIMAL(10, 2) NOT NULL,
  yield_rate DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- インデックス作成（パフォーマンス最適化）
-- ============================================================

CREATE INDEX idx_plantings_planted_date ON plantings(planted_date);
CREATE INDEX idx_plantings_location ON plantings(location);
CREATE INDEX idx_shipments_shipment_date ON shipments(shipment_date);
CREATE INDEX idx_shipments_planting_id ON shipments(planting_id);
CREATE INDEX idx_shipments_destination_id ON shipments(destination_id);
CREATE INDEX idx_processing_processing_date ON processing(processing_date);
CREATE INDEX idx_processing_part ON processing(part);

-- ============================================================
-- Row Level Security (RLS) 有効化
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが全テーブルを読み取り可能
CREATE POLICY "Enable read for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable read for all users" ON destinations FOR SELECT USING (true);
CREATE POLICY "Enable read for all users" ON plantings FOR SELECT USING (true);
CREATE POLICY "Enable read for all users" ON shipments FOR SELECT USING (true);
CREATE POLICY "Enable read for all users" ON processing FOR SELECT USING (true);

-- 認証済みユーザーが挿入・更新・削除可能
CREATE POLICY "Enable insert for authenticated users" ON destinations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON plantings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON shipments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON processing FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON destinations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON plantings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON shipments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON processing FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON destinations FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON plantings FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON shipments FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON processing FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 初期データ投入：出荷先マスター
-- ============================================================

INSERT INTO destinations (name, unit_price) VALUES
  ('六雁', NULL),
  ('佐ノ家', NULL),
  ('Satologue.', NULL),
  ('The Flats.', NULL),
  ('わさび食堂', 35)
ON CONFLICT (name) DO NOTHING;
