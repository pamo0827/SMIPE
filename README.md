# SMIPE

<p align="center">
  <img src="app/assets/images/SMIPE_logo.png" alt="SMIPE Logo" width="200"/>
</p>

<p align="center">
  <strong>YouTubeの音楽をシンプルに楽しむ</strong>
</p>

## 概要

SMIPEは、YouTubeの音楽をシンプルに楽しめる音楽プレイヤーアプリです。日本のトレンド音楽を自動再生し、直感的なUIで音楽体験を提供します。

## 主な機能

### 音楽機能
- **YouTube音楽再生**: 日本のトレンド音楽を自動表示・再生
- **音楽検索**: 曲名やアーティスト名でYouTube音楽を検索
- **おすすめ**: あなたへのおすすめ音楽を表示
- **フィードバック**: GOOD / NOT FOR ME ボタンで好みを記録

### ユーザー機能
- **メール認証**: メールアドレスとパスワードで登録・ログイン
- **プレイリスト**: お気に入りの曲をプレイリストに保存（ログイン時）

## 技術スタック

### バックエンド
- **Ruby on Rails 8.0**
- **Ruby 3.3**
- **SQLite3** (開発環境)
- **bcrypt** (パスワード暗号化)

### フロントエンド
- **Stimulus.js** (Rails標準のJavaScriptフレームワーク)
- **Turbo** (SPA-likeな体験を提供)
- **YouTube iframe API** (音楽再生)

### 外部API
- **YouTube Data API v3** (音楽検索・トレンド取得・動画詳細)

### デプロイメント
- **Render** (ホスティング)
- **Docker** (コンテナ化)

## 必要要件

- Ruby 3.2.2以上
- Rails 8.0.0以上
- YouTube Data API v3 認証情報（API Key）

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/GYact/SMIPE.git
cd SMIPE
```

### 2. 依存関係のインストール

```bash
bundle install
```

### 3. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成：

```env
YOUTUBE_API_KEY=your_youtube_api_key
```

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

## 使い方

1. **アクセス**: `http://localhost:3000` にアクセス
2. **自動再生**: 日本のトレンド音楽が自動で再生されます
3. **操作**:
   - 再生/一時停止: 中央のボタンまたはアルバムアートをクリック
   - 次の曲/前の曲: コントロールボタンで操作
   - GOOD: 気に入った曲にマーク
   - NOT FOR ME: スキップして次の曲へ
4. **検索**: ヘッダーの検索バーで曲を検索

## カラースキーム

- プライマリカラー: #1DB954 (Green)
- 背景色: #121212 (Dark)
- テキスト: #FFFFFF / #B3B3B3

## ライセンス

このプロジェクトは[MITライセンス](LICENSE)の下で公開されています。

## クレジット

- **Music provided by YouTube**
- YouTube Data API v3を使用

---

<p align="center">
  Made with ❤️ by SMIPE Team
</p>
