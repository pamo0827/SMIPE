class MapsController < ApplicationController
  before_action :require_login, only: [:create_pin]

  # 地図ページ（公開アクセス）
  def index
    # ログインユーザーの位置情報を取得
    @user_location = if logged_in? && current_user.has_location?
      {
        latitude: current_user.latitude,
        longitude: current_user.longitude,
        location_name: current_user.location_name
      }
    else
      {
        latitude: nil,
        longitude: nil,
        location_name: nil
      }
    end

    # 緯度経度から住所を取得
    if @user_location[:latitude].present? && @user_location[:longitude].present?
      results = Geocoder.search([@user_location[:latitude], @user_location[:longitude]])
      @user_location[:address] = results.first.address if results.first
    end
  end

  # 地図上の音楽ピン一覧（公開アクセス）
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
          created_at: pin.created_at,
          user: {
            name: pin.user.name,
            image: pin.user.profile_image_url
          }
        }
      end
    }
  end

  # 地図に音楽を投稿（ログイン必須）
  def create_pin
    video_id = params[:video_id]
    latitude = params[:latitude]
    longitude = params[:longitude]
    location_name = params[:location_name]

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
      pin_type: 'song'
    )

    if music_pin.save
      render json: {
        success: true,
        message: '地図に投稿しました',
        pin: {
          id: music_pin.id,
          video_id: music_pin.video_id,
          name: music_pin.name,
          channel_name: music_pin.channel_name,
          thumbnail_url: music_pin.thumbnail_url,
          latitude: music_pin.latitude,
          longitude: music_pin.longitude,
          location_name: music_pin.location_name
        }
      }
    else
      render json: { success: false, error: music_pin.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def require_login
    unless logged_in?
      respond_to do |format|
        format.html { redirect_to login_path, alert: 'ログインが必要です。' }
        format.json { render json: { error: 'ログインが必要です。' }, status: :unauthorized }
      end
    end
  end
end
