# 🚀 Vercel デプロイマニュアル - わさび田管理システム

## 📋 概要

このマニュアルは、わさび田管理システムを **Vercel にデプロイ** するための完全な手順です。

**所要時間：約15分**

---

## ✅ 準備物

以下が揃っていることを確認してください：

```
✅ GitHub アカウント（持ってる）
✅ wasabi-app.zip（ダウンロード済み）
✅ Supabase の Project URL（持ってる）
✅ Supabase の Anon Key（持ってる）
```

---

## 🎯 手順（4ステップ）

### **ステップ 1️⃣：GitHub にリポジトリを作成**

#### **1-1. GitHub にログイン**

```
https://github.com にアクセス
右上 「Sign in」でログイン
```

#### **1-2. 新しいリポジトリを作成**

```
右上の「+」アイコン
  → 「New repository」をクリック
```

#### **1-3. リポジトリの設定**

```
Repository name: wasabi-app
Description: Wasabi Farm Management System
Public / Private: Public（推奨）
✅ Add a README file
✅ Add .gitignore
```

**「Create repository」をクリック**

---

### **ステップ 2️⃣：ファイルをアップロード**

#### **2-1. wasabi-app.zip を展開**

```
1. ダウンロードしたファイルを右クリック
2. 「展開」または「解凍」
3. wasabi-app フォルダが出現
```

#### **2-2. GitHub で「Add file」をクリック**

```
リポジトリページ
  → 「Add file」ボタン
  → 「Upload files」を選択
```

#### **2-3. ファイルをドラッグ＆ドロップ**

```
以下をアップロード：
  📁 wasabi-app フォルダの中身（全ファイル）
  - WasamiApp.jsx
  - package.json
  - tailwind.config.js
  - index.js
  - .env.example
  - その他
```

#### **2-4. Commit message を入力**

```
「Initial commit」と入力
「Commit changes」をクリック
```

---

### **ステップ 3️⃣：Vercel にデプロイ**

#### **3-1. Vercel にサインアップ**

```
https://vercel.com にアクセス
「Sign up」をクリック
GitHub でサインアップ（推奨）
  → GitHub アカウントを連携
```

#### **3-2. 新しいプロジェクトを作成**

```
Vercel ダッシュボール
  → 「New Project」をクリック
```

#### **3-3. GitHub リポジトリを選択**

```
「GitHub」タブをクリック
  → wasabi-app リポジトリを検索
  → 「Import」をクリック
```

#### **3-4. ビルド設定を確認**

```
Framework Preset: Create React App
Root Directory: ./
Build Command: npm run build（デフォルト）
Output Directory: build（デフォルト）

そのまま「Deploy」をクリック
```

---

### **ステップ 4️⃣：環境変数を設定**

#### **4-1. Vercel Project Settings に行く**

```
Vercel ダッシュボール
  → プロジェクト名（wasabi-app）をクリック
  → 「Settings」タブ
  → 「Environment Variables」をクリック
```

#### **4-2. 環境変数を追加**

以下の2つを追加します：

**1つ目：**
```
Name: REACT_APP_SUPABASE_URL
Value: https://jjopgofxutgfrhxtuxxz.supabase.co
Environment: Production, Preview, Development（全部チェック）
```

**2つ目：**
```
Name: REACT_APP_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqb3Bnb2Z4dXRnZnJoeHR1eHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzExODQsImV4cCI6MjA5MTIwNzE4NH0.U_ttlvFKU80JVReeQAk_mXvjUFq5LEP7gwGN-x_Ms_Q
Environment: Production, Preview, Development（全部チェック）
```

各行で「Save」をクリック

---

#### **4-3. デプロイを再実行**

```
Vercel ダッシュボール
  → 「Deployments」タブ
  → 最新のデプロイをクリック
  → 右上の「Redeploy」をクリック
```

---

## ✅ デプロイ完了！

数分待つと、以下が表示されます：

```
✅ Production: Ready
   https://wasabi-app-XXXX.vercel.app
```

**この URL がアプリケーションのオンラインアドレスです！** 🎉

---

## 📱 スマホでテスト

```
1. URL をスマホのブラウザに貼り付け
2. Google でログイン
3. 動作確認！
```

---

## 🔧 トラブルシューティング

### **Q: デプロイに失敗した**
```
A: 以下を確認：
  1. package.json が存在するか
  2. ビルドエラーがないか（Vercel の Build ログを確認）
  3. 環境変数が正しく設定されているか
```

### **Q: ログインできない**
```
A: 以下を確認：
  1. Supabase で Google OAuth が有効になっているか
  2. 環境変数が正しいか（コピペミス確認）
  3. Supabase のセッションが有効か
```

### **Q: データが表示されない**
```
A: 以下を確認：
  1. Supabase の RLS が正しく設定されているか
  2. 環境変数が正しく反映されているか
  3. デプロイ後、ページをリロード（Ctrl+F5）
```

---

## 🎯 デプロイ後にやること

```
1. ✅ スマホでテスト（Google ログイン）
2. ✅ 植え付け記録を1件入力
3. ✅ 出荷記録を1件入力
4. ✅ ダッシュボードを確認
5. ✅ 問題があったら、チャットで報告
```

---

## 📞 サポート

何か問題が発生したら、以下の情報とともにチャットで報告してください：

```
- エラーメッセージ（スクリーンショット）
- Vercel のビルドログ
- ブラウザのコンソール（F12）
```

---

## 🌾 完成！

これで、わさび田管理システムがオンラインで動作します。

**本当にお疲れ様でした！** 🎉

たっちゃんに URL を教えて、スマホからアプリを使ってもらってください。

---

**Happy わさび farming! 🌾✨**
