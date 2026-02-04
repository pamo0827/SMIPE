class PlayerController < ApplicationController
  # 認証不要 - 誰でも音楽を聴ける

  def show
    youtube_service = YoutubeService.new

    # トレンド動画を取得（おすすめ表示用）
    @trending_videos = youtube_service.trending_music_japan(max_results: 20)

    # 動画IDsを取得（トレンド音楽または近くの音楽）
    @video_ids = if has_location_permission?
                   fetch_nearby_music || @trending_videos.map { |v| v[:video_id] }
                 else
                   @trending_videos.map { |v| v[:video_id] }
                 end

    # 最初の動画の詳細を取得
    if @video_ids.any?
      @first_video = youtube_service.video_details(@video_ids.first)
    else
      @first_video = nil
    end

    # 年代別おすすめ（APIコール削減のため一部のみ取得）
    @era_sections = [
      { era: "90s", label: "90年代の名曲", videos: youtube_service.search_by_era("90s", max_results: 8) },
      { era: "2000s", label: "2000年代ヒット", videos: youtube_service.search_by_era("2000s", max_results: 8) }
    ]

    # アーティスト別おすすめ
    @artist_sections = [
      { artist: "YOASOBI", videos: youtube_service.search_by_artist("YOASOBI", max_results: 8) },
      { artist: "Official髭男dism", videos: youtube_service.search_by_artist("Official髭男dism", max_results: 8) }
    ]
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

  # 地図に音楽を投稿（ログイン必須）
  def save_pin
    require_login_for_action

    video_id = params[:video_id]
    latitude = params[:latitude]
    longitude = params[:longitude]
    location_name = params[:location_name]
    comment = params[:comment]
    first_track_uri = params[:first_track_uri]
    image = params[:image]

    if video_id.blank? || latitude.blank? || longitude.blank?
      render json: { success: false, error: '必須パラメータが不足しています' }, status: :bad_request
      return
    end

    # YouTube動画詳細を取得
    youtube_service = YoutubeService.new
    video = youtube_service.video_details(video_id)

    if video.nil?
      render json: { success: false, error: '動画が見つかりません' }, status: :not_found
      return
    end

    # MusicPinを作成
    music_pin = current_user.music_pins.new(
      video_id: video_id,
      name: video[:title],
      channel_name: video[:channel_name],
      thumbnail_url: video[:thumbnail],
      duration: video[:duration],
      latitude: latitude,
      longitude: longitude,
      location_name: location_name,
      comment: comment,
      pin_type: 'song'
    )

    if music_pin.save
      render json: { success: true, message: '地図に投稿しました', pin: music_pin }
    else
      render json: { success: false, error: music_pin.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # 地図上のピン一覧
  def pins
    music_pins = MusicPin.youtube_pins.recent.limit(100)

    render json: {
      pins: music_pins.map do |pin|
        {
          id: pin.id,
          video_id: pin.video_id,
          name: pin.name,
          channel_name: pin.channel_name,
          thumbnail_url: pin.thumbnail_url,
          duration: pin.duration,
          formatted_duration: pin.formatted_duration,
          latitude: pin.latitude,
          longitude: pin.longitude,
          location_name: pin.location_name,
          comment: pin.try(:comment),
          created_at: pin.created_at,
          user: {
            name: pin.user.name,
            image: pin.user.profile_image_url
          }
        }
      end

  private

  def has_location_permission?
    # TODO: 実装 - クライアントから位置情報が送られてきたかチェック
    params[:latitude].present? && params[:longitude].present?
  end

  def fetch_nearby_music
    return nil unless has_location_permission?

    latitude = params[:latitude].to_f
    longitude = params[:longitude].to_f

    # 近くの音楽ピンを取得
    nearby_pins = MusicPin.youtube_pins.near_location(latitude, longitude, 10).limit(20)

    if nearby_pins.any?
      nearby_pins.pluck(:video_id)
    else
      nil
    end
  end

  def fetch_trending_music(youtube_service)
    trending_videos = youtube_service.trending_music_japan(max_results: 20)
    trending_videos.map { |video| video[:video_id] }
  end

  def require_login_for_action
    unless logged_in?
      render json: { error: 'ログインが必要です' }, status: :unauthorized
    end
  end

  public

  # セクション更新API
  def refresh_section
    youtube_service = YoutubeService.new
    section_type = params[:section_type]
    section_value = params[:section_value]

    videos = case section_type
             when 'trending'
               youtube_service.trending_music_japan(max_results: 12)
             when 'era'
               youtube_service.search_by_era(section_value, max_results: 8)
             when 'artist'
               youtube_service.search_by_artist(section_value, max_results: 8)
             else
               []
             end

    render json: { videos: videos }
  end

  # いいね/NOT FOR ME履歴を取得
  def interactions
    unless logged_in?
      render json: { likes: [], dislikes: [] }
      return
    end

    youtube_service = YoutubeService.new

    # いいね履歴を取得
    likes = current_user.music_interactions.likes.recent.limit(20)
    like_videos = likes.map do |interaction|
      video = youtube_service.video_details(interaction.video_id)
      next nil unless video
      {
        video_id: interaction.video_id,
        title: video[:title],
        channel_name: video[:channel_name],
        thumbnail: video[:thumbnail],
        created_at: interaction.created_at
      }
    end.compact

    # NOT FOR ME履歴を取得
    dislikes = current_user.music_interactions.dislikes.recent.limit(20)
    dislike_videos = dislikes.map do |interaction|
      video = youtube_service.video_details(interaction.video_id)
      next nil unless video
      {
        video_id: interaction.video_id,
        title: video[:title],
        channel_name: video[:channel_name],
        thumbnail: video[:thumbnail],
        created_at: interaction.created_at
      }
    end.compact

    render json: { likes: like_videos, dislikes: dislike_videos }
  end
end
