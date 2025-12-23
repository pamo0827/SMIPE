class User < ApplicationRecord
  # has_secure_password

  # 音楽ピン関連
  has_many :music_pins, dependent: :destroy
  has_many :music_interactions, dependent: :destroy
  has_many :posted_queue_items, class_name: 'MusicQueueItem', foreign_key: 'posted_by_id', dependent: :destroy
  has_many :received_queue_items, class_name: 'MusicQueueItem', foreign_key: 'received_by_id', dependent: :nullify

  # プロフィール画像URL
  def profile_image_url
    image.presence
  end

  # いいねした動画
  def liked_videos
    music_interactions.likes.pluck(:video_id)
  end

  # 再生履歴
  def play_history
    music_interactions.plays.recent.limit(50)
  end
end
