# SMIPE
YouTubeの音楽を楽しめる音楽プレイヤーアプリです。日本のトレンド音楽を自動再生し、直感的なUIで音楽体験を提供します。

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

## カラースキーム

- プライマリカラー: #1DB954 (Green)
- 背景色: #121212 (Dark)
- テキスト: #FFFFFF / #B3B3B3

## ライセンス

このプロジェクトは[MITライセンス](LICENSE)の下で公開されています。

## クレジット

- **Music provided by YouTube**
- YouTube Data API v3を使用

