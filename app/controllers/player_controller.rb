class PlayerController < ApplicationController
  # 認証不要 - 誰でも音楽を聴ける

  def show
    @hide_header = true
    youtube_service = YoutubeService.new

    # キューから曲を取得（ログイン時のみ）
    if logged_in?
      queue_item = MusicQueueItem.next_in_queue

      if queue_item
        # キューから曲を取得
        queue_item.mark_as_delivered(current_user)
        @first_video = {
          video_id: queue_item.music_pin.video_id,
          title: queue_item.music_pin.name,
          channel_name: queue_item.music_pin.channel_name,
          thumbnail: queue_item.music_pin.thumbnail_url,
          duration: queue_item.music_pin.duration
        }
        @video_ids = [queue_item.music_pin.video_id]
        @queue_message = "#{queue_item.posted_by.name}さんと曲を通信しました！"
      else
        # キューが空の場合、トレンド曲を取得
        @video_ids = fetch_trending_music(youtube_service)
        @first_video = youtube_service.video_details(@video_ids.first) if @video_ids.any?
        @queue_message = nil
      end
    else
      # 未ログインの場合、トレンド曲を取得
      @video_ids = fetch_trending_music(youtube_service)
      @first_video = youtube_service.video_details(@video_ids.first) if @video_ids.any?
      @queue_message = nil
    end
  end

  # いいね（ログイン必須）
  def like
    require_login_for_action
    video_id = params[:video_id]

    if video_id.present?
      interaction = current_user.music_interactions.find_or_initialize_by(
        video_id: video_id,
        interaction_type: 'like'
      )

      if interaction.save
        render json: { success: true, message: 'いいねしました' }
      else
        render json: { success: false, error: interaction.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { success: false, error: '動画IDが必要です' }, status: :bad_request
    end
  end

  # 嫌い（ログイン必須）
  def dislike
    require_login_for_action
    video_id = params[:video_id]

    if video_id.present?
      interaction = current_user.music_interactions.find_or_initialize_by(
        video_id: video_id,
        interaction_type: 'dislike'
      )

      if interaction.save
        render json: { success: true, message: '嫌いに登録しました' }
      else
        render json: { success: false, error: interaction.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { success: false, error: '動画IDが必要です' }, status: :bad_request
    end
  end

  # 再生履歴記録（ログイン時のみ）
  def record_play
    return unless logged_in?

    video_id = params[:video_id]

    if video_id.present?
      current_user.music_interactions.create(
        video_id: video_id,
        interaction_type: 'play'
      )
    end

    head :no_content
  end

  private

  def fetch_trending_music(youtube_service)
    trending_videos = youtube_service.trending_music_japan(max_results: 20)
    trending_videos.map { |video| video[:video_id] }
  end

  def require_login_for_action
    unless logged_in?
      render json: { error: 'ログインが必要です' }, status: :unauthorized
    end
  end
end
