-- ============================================================
-- わさび管理システム：初期データ投入スクリプト
-- ============================================================

-- ============================================================
-- 1️⃣ 植え付けロットデータ（Notionから）
-- ============================================================

INSERT INTO plantings (location, planted_date, planted_quantity, variety, status, harvested_date, harvested_quantity, notes) VALUES
('木が倒れている場所', '2026-03-25', 117, '天城ニシキ', '生育中', NULL, NULL, NULL),
('6', '2026-03-20', 129, '実生', '生育中', NULL, NULL, NULL),
('5', '2026-03-20', 196, '実生', '生育中', NULL, NULL, NULL),
('メイン横のわさび田（新しく直した所） (1)', '2026-03-18', 58, '天城ニシキ', '生育中', NULL, NULL, NULL),
('メイン横のわさび田（新しく直した所） (1)', '2026-03-18', 60, '天城ニシキ', '生育中', NULL, NULL, NULL),
('メイン横のわさび田（新しく直した所） (1)', '2026-03-18', 40, '天城ニシキ', '生育中', NULL, NULL, NULL),
('メイン横のわさび田（新しく直した所）', '2026-03-18', 94, '天城ニシキ', '生育中', NULL, NULL, NULL),
('キッチン横', '2026-03-12', 60, '天城ニシキ', '生育中', NULL, NULL, NULL),
('4', '2026-02-22', 294, '真妻（2代目）', '生育中', NULL, NULL, NULL),
('3', '2026-02-22', 133, '真妻（2代目）', '生育中', NULL, NULL, NULL),
('2', '2026-02-22', 92, '真妻（2代目）', '生育中', NULL, NULL, NULL),
('1', '2026-02-22', 52, '真妻（2代目）', '生育中', NULL, NULL, NULL),
('越沢05-05', '2025-11-12', 18, 'レイワ', '生育中', NULL, NULL, NULL),
('越沢05-04', '2025-11-12', 66, '5783', '生育中', NULL, NULL, NULL),
('越沢（詳細不明）', '2025-11-11', 56, '5783', '生育中', NULL, NULL, NULL),
('越沢（詳細不明）', '2025-11-11', 56, 'レイワ', '生育中', NULL, NULL, NULL),
('越沢07-04', '2025-11-11', 50, '5783', '生育中', NULL, NULL, NULL),
('越沢06-06', '2025-11-11', 76, '5783', '生育中', NULL, NULL, NULL),
('越沢07-01', '2025-11-10', 64, '5783', '生育中', NULL, NULL, NULL),
('越沢06-01', '2025-11-10', 104, 'レイワ', '生育中', NULL, NULL, NULL),
('越沢10-03', '2025-11-05', 133, 'イシダル', '生育中', NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2️⃣ 加工記録（Excelから）
-- ============================================================

INSERT INTO processing (processing_date, part, weight_before, weight_after, yield_rate, notes) VALUES
('2026-02-28', '花', 1600, 831, 51.94, NULL),
('2026-02-28', '茎, 葉', 3070, 1502, 48.93, NULL),
('2026-03-11', '花', 6060, 3200, 52.81, NULL),
('2026-03-20', '花', 3700, 2230, 60.27, NULL),
('2026-03-20', '葉, 茎', 4260, 2050, 48.12, NULL),
('2026-03-25', '花', 2930, 1473, 50.27, NULL),
('2026-03-25', '茎, 葉', 1300, 650, 50.00, 'わさび食堂用'),
('2026-03-31', '花', 34260, 11500, 33.57, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3️⃣ わさび食堂の出荷記録
-- ============================================================
-- 注：plantings テーブルからランダムにIDを取得して連携
-- ※実際の記録では「どの植え付けロットから出荷したか」を特定する必要があります
-- 以下は最初の対応例として、最新の植え付けロットから出荷したと仮定しています

WITH latest_planting AS (
  SELECT id FROM plantings 
  WHERE variety = '天城ニシキ' 
  ORDER BY planted_date DESC 
  LIMIT 1
)
INSERT INTO shipments (planting_id, destination_id, shipment_date, quantity, unit_price, total_amount, notes) VALUES
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-10', 11, 35, 1155, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-11', 9, 35, 945, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-12', 11, 35, 1155, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-17', 15, 35, 1575, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-18', 10, 35, 1050, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-19', 11, 35, 1155, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-20', 10, 35, 1050, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-21', 11, 35, 1155, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-24', 13, 35, 1365, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-25', 11, 35, 1155, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-26', 11, 35, 1155, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-27', 11, 35, 1155, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-28', 9, 35, 945, NULL),
((SELECT id FROM latest_planting), (SELECT id FROM destinations WHERE name = 'わさび食堂'), '2026-01-31', 10, 35, 1050, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 注意事項
-- ============================================================
/*
✅ 上のデータ投入スクリプトは「サンプル」です。
   実際には以下の対応が必要です：

1️⃣ わさび食堂の出荷記録
   - 提供数（杯） × 3g × 35円/g = 金額
   - アプリ側で「どの植え付けロットから出荷したか」を特定するUI が必要

2️⃣ 六雁・その他の出荷記録
   - Excelには過去データがないため、アプリで最初から記録開始
   - アプリ側で「どの植え付けロットから出荷したか」を選択する必要

3️⃣ Reactアプリの入力フォームで
   - 植え付けロットを「エリア → 詳細場所 → ロット」で階層選択
   - 出荷先を選択
   - 出荷量と単価を入力
   - 自動で合計金額を計算
*/
