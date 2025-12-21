# SMIPE

<p align="center">
  <img src="app/assets/images/SMIPE_logo.png" alt="SMIPE Logo" width="200"/>
</p>

<p align="center">
  <strong>音楽で、世界とつながる。あなたのいる場所が、新しいプレイリストになる。</strong>
</p>

## 📖 概要

SMIPEは、位置情報とYouTube音楽を組み合わせた革新的なソーシャル音楽共有プラットフォームです。**認証不要で音楽を楽しめる**「体験優先」のUXを採用し、地図への音楽投稿時のみGoogle認証が必要です。

## ✨ 主な機能

### 🎵 音楽機能（認証不要）
- **YouTube音楽再生**: 日本のトレンド音楽を自動表示・再生
- **音楽検索**: 曲名やアーティスト名でYouTube音楽を検索
- **スワイプジェスチャー**: いいね（右）、嫌い（左）、次（上）、前（下）
- **シークバー**: 再生位置を自由に変更

### 🗺️ 地図・位置情報機能
- **地図閲覧**: 誰でも地図上の音楽ピンを閲覧可能
- **現在地表示**: 位置情報許可で現在地を地図上に表示
- **音楽ピン投稿**: ログイン後、YouTube動画を地図に投稿（ログイン必須）
- **すれちがい通信**: 近くの音楽ピンを発見

### 👥 ソーシャル機能
- **Google OAuth認証**: 地図投稿時のみログインが必要
- **音楽インタラクション**: いいね・嫌いの記録（ログイン時のみ）
- **再生履歴**: 自分の音楽視聴履歴を確認（ログイン時のみ）

## 🎯 体験優先のUX設計

SMIPEは「体験優先、説明後回し」の哲学で設計されています：

1. **ホームページ**: 「音楽を聴く」ボタン（プライマリCTA）→ ログイン不要
2. **プレイヤー**: 認証なしで日本のトレンド音楽が即座に再生開始
3. **地図閲覧**: 認証なしで誰でも音楽ピンを閲覧可能
4. **投稿機能**: 地図に音楽を投稿する時のみGoogleログインが必要

**Flow**: **Sound → Location** or **Post**

## 🛠 技術スタック

### バックエンド
- **Ruby on Rails 8.0.~**
- **Ruby 3.3**
- **SQLite3** (開発環境)

### フロントエンド
- **Stimulus.js** (Rails標準のJavaScriptフレームワーク)
- **Turbo** (SPA-likeな体験を提供)
- **Import Maps** (モダンなJavaScript管理)
- **Leaflet.js** (地図表示)
- **YouTube iframe API** (音楽再生)

### 外部API・サービス
- **YouTube Data API v3** (音楽検索・トレンド取得・動画詳細)
- **Google OAuth 2.0** (認証 - 地図投稿時のみ)
- **Google Maps Geocoding API** (逆ジオコーディング)

### デプロイメント・インフラ
- **Docker** (コンテナ化)
- **Kamal** (デプロイメントツール)
- **GitHub Actions** (CI/CD)

## 📋 必要要件

- Ruby 3.2.2以上
- Rails 8.0.0以上
- Node.js (JavaScript実行環境)
- Google Cloud Platform アカウント
- YouTube Data API v3 認証情報（API Key）
- Google OAuth 2.0 認証情報（Client ID、Client Secret）

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/SMIPE.git
cd SMIPE
```

### 2. 依存関係のインストール

```bash
bundle install
```

### 3. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成し、以下の環境変数を設定：

```env
# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**環境変数の取得方法**: `SETUP.md`を参照

### 4. データベースのセットアップ

```bash
rails db:create
rails db:migrate
```

### 5. アプリケーションの起動

```bash
rails server
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 🐳 Dockerでの実行

```bash
# イメージのビルド
docker build -t smipe .

# コンテナの起動
docker run -p 3000:3000 \
  -e YOUTUBE_API_KEY=your_api_key \
  -e GOOGLE_CLIENT_ID=your_client_id \
  -e GOOGLE_CLIENT_SECRET=your_client_secret \
  smipe
```

## 📱 使い方

### 認証不要で音楽を楽しむ

1. **ホームページ**: `http://localhost:3000` にアクセス
2. **「音楽を聴く」ボタンをクリック**: ログイン不要
3. **トレンド音楽が自動再生**: 日本のトレンド音楽が即座に再生
4. **スワイプ操作**:
   - 右スワイプ → いいね
   - 左スワイプ → 嫌い
   - 上スワイプ → 次の曲
   - 下スワイプ → 前の曲

### 地図で音楽を発見

1. **地図ページ**: `/map` にアクセス（認証不要）
2. **位置情報許可**: ブラウザで位置情報を許可（任意）
3. **音楽ピンを閲覧**: 地図上の音楽ピンをクリックして曲情報を確認
4. **再生**: ピンから直接YouTube動画を再生

### 地図に音楽を投稿（ログイン必須）

1. **Googleログイン**: ホームページまたはプレイヤーから「Googleでログイン」
2. **地図ページ**: `/map` にアクセス
3. **YouTube検索**: 曲名やアーティスト名で検索
4. **動画選択**: 検索結果から曲を選択
5. **投稿**: 「この曲を地図に投稿」ボタンをクリック

## 🧪 テスト

統合テストシナリオは `TESTING.md` を参照してください。

```bash
# 全てのテストを実行
rails test

# システムテストを含む全テストの実行
rails test:system
```

## 🔒 セキュリティ

- YouTube Data API v3によるコンテンツ提供（ダウンロード機能なし）
- Google OAuth 2.0による安全な認証
- CSRF保護トークンの使用
- SSL/TLS暗号化通信
- 環境変数による機密情報の管理
- Brakemanによる静的セキュリティ解析

## 📊 データモデル

### User
- Google OAuth認証情報
- 位置情報（latitude, longitude, location_name）
- プロフィール情報（name, email, image）

### MusicPin
- YouTube動画情報（video_id, name, channel_name, thumbnail_url, duration）
- 位置情報（latitude, longitude, location_name）
- ピンタイプ（song, album, legacy_spotify）

### MusicInteraction
- ユーザーの音楽インタラクション（like, dislike, play）
- 動画ID（video_id）
- インタラクションタイプ（interaction_type）

## 🎨 UIデザイン哲学

### SMIPEらしさ
1. **ログインを強調しない**: 体験が先、説明は後
2. **Sound → Location or Post**: 音楽を聴く → 位置情報 or 投稿
3. **シンプルで直感的**: スワイプジェスチャーでサクサク操作

### カラースキーム
- プライマリカラー: #1DB954 (Spotify Green)
- セカンダリカラー: #B3B3B3 (Gray)
- 背景色: Dark theme optimized

## 📝 開発ガイドライン

### コーディング規約
- RuboCop Rails Omakaseに準拠
- 行の最大長: 120文字
- メソッドの最大行数: 15行

### ブランチ戦略
- `main`: プロダクション環境
- `feature/*`: 機能開発
- `hotfix/*`: 緊急修正

## 🚀 デプロイ

デプロイ手順は `DEPLOYMENT.md` を参照してください。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは[MITライセンス](LICENSE)の下で公開されています。

## 📚 関連ドキュメント

- [TESTING.md](TESTING.md) - 統合テストシナリオ
- [SETUP.md](SETUP.md) - 環境変数取得ガイド（作成予定）
- [DEPLOYMENT.md](DEPLOYMENT.md) - デプロイ手順（作成予定）

## 📧 お問い合わせ

プロジェクトに関する質問や提案がある場合は、[Issues](https://github.com/yourusername/SMIPE/issues)でお知らせください。

## 🙏 クレジット

- **Music provided by YouTube**
- YouTube Data API v3を使用
- Google OAuth 2.0を使用
- Leaflet.jsを地図表示に使用

---

<p align="center">
  Made with ❤️ by SMIPE Team
</p>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
