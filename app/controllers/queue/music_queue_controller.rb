class Queue::MusicQueueController < ApplicationController
  before_action :require_login, only: [:add, :next]

  # POST /queue/add
  # 曲をキューに追加
  def add
    video_id = params[:video_id]

    if video_id.blank?
      render json: { success: false, error: '動画IDが必要です' }, status: :bad_request
      return
    end

    # YouTube動画詳細を取得
    youtube_service = YoutubeService.new
    video = youtube_service.video_details(video_id)

    if video.nil?
      render json: { success: false, error: '動画が見つかりません' }, status: :not_found
      return
    end

    # MusicPinを作成（位置情報なし）
    music_pin = current_user.music_pins.new(
      video_id: video_id,
      name: video[:title],
      channel_name: video[:channel_name],
      thumbnail_url: video[:thumbnail],
      duration: video[:duration],
      pin_type: 'song'
    )

    if music_pin.save
      # キューに追加
      queue_item = MusicQueueItem.add_to_queue(music_pin, current_user)

      render json: {
        success: true,
        message: 'キューに追加しました',
        queue_position: queue_item.queue_position
      }
    else
      render json: { success: false, error: music_pin.errors.full_messages }, status: :unprocessable_entity
    end
  rescue => e
    Rails.logger.error("Queue add error: #{e.message}")
    render json: { success: false, error: 'キューへの追加に失敗しました' }, status: :internal_server_error
  end

  # GET /queue/next
  # 次の曲を取得（FIFO）
  def next
    queue_item = MusicQueueItem.next_in_queue

    if queue_item.nil?
      # キューが空の場合、トレンド曲を返す
      youtube_service = YoutubeService.new
      trending_videos = youtube_service.trending_music_japan(max_results: 1)

      if trending_videos.any?
        video = trending_videos.first
        render json: {
          success: true,
          video: video,
          from_queue: false,
          message: 'キューが空です。トレンド曲を再生します'
        }
      else
        render json: { success: false, error: 'キューが空で、トレンド曲も取得できませんでした' }, status: :not_found
      end
      return
    end

    # 配信済みとしてマーク
    queue_item.mark_as_delivered(current_user)

    # 投稿者情報を含めて返す
    render json: {
      success: true,
      video: {
        video_id: queue_item.music_pin.video_id,
        title: queue_item.music_pin.name,
        channel_name: queue_item.music_pin.channel_name,
        thumbnail: queue_item.music_pin.thumbnail_url,
        duration: queue_item.music_pin.duration
      },
      from_queue: true,
      posted_by: {
        id: queue_item.posted_by.id,
        name: queue_item.posted_by.name,
        image: queue_item.posted_by.profile_image_url
      },
      message: "#{queue_item.posted_by.name}さんと曲を通信しました！"
    }
  rescue => e
    Rails.logger.error("Queue next error: #{e.message}")
    render json: { success: false, error: '曲の取得に失敗しました' }, status: :internal_server_error
  end

  # GET /queue/status
  # キューの状態確認
  def status
    pending_count = MusicQueueItem.pending.count
    user_posted_count = current_user ? current_user.posted_queue_items.pending.count : 0
    user_received_count = current_user ? current_user.received_queue_items.count : 0

    render json: {
      pending_count: pending_count,
      user_posted_count: user_posted_count,
      user_received_count: user_received_count
    }
  end

  private

  def require_login
    unless logged_in?
      render json: { error: 'ログインが必要です' }, status: :unauthorized
    end
  end
end
