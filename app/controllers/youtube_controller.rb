class YoutubeController < ApplicationController
  before_action :initialize_youtube_service

  # GET /youtube/search?q={query}
  # 音楽検索
  def search
    query = params[:q]

    if query.blank?
      render json: { error: '検索クエリが必要です' }, status: :bad_request
      return
    end

    results = @youtube_service.search_music(query)
    render json: { results: results, count: results.length }
  end

  # GET /youtube/trending
  # 日本のトレンド音楽取得
  def trending
    results = @youtube_service.trending_music_japan
    render json: { results: results, count: results.length }
  end

  # GET /youtube/video/:id
  # 動画詳細取得
  def video
    video_id = params[:id]

    if video_id.blank?
      render json: { error: '動画IDが必要です' }, status: :bad_request
      return
    end

    video = @youtube_service.video_details(video_id)

    if video
      render json: { video: video }
    else
      render json: { error: '動画が見つかりません' }, status: :not_found
    end
  end

  private

  def initialize_youtube_service
    @youtube_service = YoutubeService.new
  end
end
