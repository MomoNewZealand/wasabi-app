# 🌾 わさび田管理システム

![Status](https://img.shields.io/badge/status-development-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

わさび栽培の「植え付け」「生育」「出荷」「加工」を一元管理するWebアプリケーション。  
スマートフォンから簡単に記録でき、ダッシュボードでリアルタイムに農業データを可視化します。

---

## 📸 スクリーンショット

```
📊 ダッシュボード
├─ 月別出荷量グラフ
├─ 出荷先別出荷量
├─ 加工歩留まり率
├─ 植え付けから出荷までの日数
├─ 出荷先ごとの頻度
└─ 部位別歩留まり比較

🌱 植え付け記録
├─ 新規記録フォーム
└─ 記録一覧（エリア、品種、ステータス）

📦 出荷記録
├─ 新規記録フォーム
└─ 出荷一覧（出荷先、数量、金額）

🔪 加工記録
├─ 新規記録フォーム
└─ 加工一覧（部位、重量、歩留まり率）
```

---

## 🎯 主な機能

### ✅ 完成度高い機能

- **✅ Google認証** - セキュアなログイン
- **✅ 植え付け記録** - エリア、品種、本数、ステータス管理
- **✅ 出荷記録** - 出荷先、数量、金額を一元管理
- **✅ 加工記録** - 部位、重量、歩留まり率を自動計算
- **✅ ダッシュボード** - 6種類のグラフで農業データを可視化
- **✅ PWA対応** - スマホホーム画面にアプリとして追加可能
- **✅ モバイルUI** - タッチフレンドリーなインターフェース

### 🔄 今後の拡張予定

- [ ] バーコード読込（QR/バーコードで圃場識別）
- [ ] CSVエクスポート（Excelに出力）
- [ ] 天気API連携（気象データ表示）
- [ ] 通知機能（重要な日程リマインダー）
- [ ] オフライン対応（電波ない場所でも入力）
- [ ] マルチユーザー支援（権限管理）

---

## 🛠️ 技術スタック

| 層 | 技術 | 用途 |
|---|---|---|
| **フロントエンド** | React 18 + Tailwind CSS | UIコンポーネント + スタイリング |
| **グラフ** | Recharts | データ可視化 |
| **バックエンド** | Supabase (PostgreSQL) | データベース管理 |
| **認証** | Supabase Auth | Google OAuth |
| **ホスティング** | Vercel | アプリケーションホスト |
| **モバイル対応** | PWA | ネイティブアプリ化 |

---

## 📁 ファイル構成

```
wasabi-management-system/
├── 01_create_tables.sql        # Supabaseテーブル作成SQL
├── 02_insert_data.sql          # 初期データ投入SQL
├── WasamiApp.jsx               # メインReactコンポーネント
├── index.js                    # Reactエントリーポイント
├── package.json                # npm依存関係
├── tailwind.config.js          # Tailwind CSS設定
├── .env.example                # 環境変数サンプル
├── public/
│   ├── index.html              # HTMLテンプレート
│   └── manifest.json           # PWA設定
├── MANUAL.md                   # セットアップマニュアル
└── README.md                   # このファイル
```

---

## 🚀 クイックスタート

### **1. Supabaseセットアップ**

```bash
# Supabase ダッシュボールで以下を実行
# SQL Editor > New Query

# 1. テーブル作成
# 01_create_tables.sql の内容を貼り付けて実行

# 2. データ投入
# 02_insert_data.sql の内容を貼り付けて実行
```

### **2. 環境変数設定**

```bash
# .env.local を作成
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
```

### **3. ローカル開発**

```bash
npm install
npm start
```

ブラウザで http://localhost:3000 が自動的に開きます。

### **4. Vercelにデプロイ**

```bash
# GitHubにプッシュ
git push origin main

# Vercelダッシュボール
# > New Project > GitHubリポジトリ選択
# > 環境変数設定 > Deploy
```

---

## 📊 データベーススキーマ

### Users テーブル
```
id (UUID)          - Googleアカウント
email (TEXT)       - メールアドレス
name (TEXT)        - 名前
role (TEXT)        - admin / worker
created_at (TS)    - 作成日時
```

### Plantings テーブル
```
id (UUID)                - 一意ID
location (TEXT)          - 詳細な場所
planted_date (DATE)      - 植え付け日
planted_quantity (INT)   - 植え付け本数
variety (TEXT)           - 苗の種類
status (TEXT)            - 生育中 / 収穫可能 / 収穫済 / 廃棄
harvested_date (DATE)    - 収穫日（null可）
harvested_quantity (INT) - 収穫本数（null可）
notes (TEXT)             - 備考
```

### Destinations テーブル
```
id (UUID)       - 一意ID
name (TEXT)     - 出荷先名（ユニーク）
unit_price (DEC) - 単価（円/g）
notes (TEXT)    - 備考
```

### Shipments テーブル
```
id (UUID)           - 一意ID
planting_id (UUID FK) - 植え付けロット
destination_id (UUID FK) - 出荷先
shipment_date (DATE) - 出荷日
quantity (DEC)      - 出荷量（g）
unit_price (DEC)    - 単価（円/g）
total_amount (DEC)  - 合計金額（円）
notes (TEXT)        - 備考
```

### Processing テーブル
```
id (UUID)          - 一意ID
processing_date (DATE) - 加工日
part (TEXT)        - 部位（花、茎・葉等）
weight_before (DEC) - 加工前重量（g）
weight_after (DEC)  - 加工後重量（g）
yield_rate (DEC)   - 歩留まり率（%）
notes (TEXT)       - 備考
```

---

## 🔐 セキュリティ

- ✅ **Row Level Security (RLS)** - データベースレベルのアクセス制限
- ✅ **Google OAuth** - 安全な認証
- ✅ **HTTPS** - 通信の暗号化
- ✅ **環境変数** - API キーの秘密管理
- ✅ **SQL Injection 対策** - Supabase JS ライブラリで自動対策

---

## 🐛 トラブルシューティング

### Q: Supabaseに接続できない
```
A: API URLとキーが正しいか確認
   Settings > API > Project URL と anon key を再度確認
```

### Q: ログインできない
```
A: Google OAuth設定が完了しているか確認
   Settings > Authentication > Providers > Google が Enabled か確認
```

### Q: データが表示されない
```
A: Row Level Security が有効になっていないか確認
   Settings > Authentication > RLS が ON か確認
```

---

## 📝 セットアップマニュアル

詳細なセットアップ手順は **MANUAL.md** を参照してください。

---

## 📞 サポート

問題が発生した場合は、チャットで報告してください。

---

## 📄 ライセンス

MIT License

---

## 🙏 謝辞

- Supabase チーム（素晴らしい BaaS プラットフォーム）
- React コミュニティ（フロントエンド開発）
- わさび農家の皆さん（実務的なフィードバック）

---

**Happy わさび farming! 🌾✨**
.
